import { ArrayOverlap, Not, In } from 'typeorm';
import * as mfm from 'mfm-js';
import { db } from '@/db/postgre.js';
import es from '@/db/elasticsearch.js';
import { publishMainStream, publishNotesStream } from '@/services/stream.js';
import { DeliverManager } from '@/remote/activitypub/deliver-manager.js';
import renderNote from '@/remote/activitypub/renderer/note.js';
import renderCreate from '@/remote/activitypub/renderer/create.js';
import renderAnnounce from '@/remote/activitypub/renderer/announce.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import { resolveUser } from '@/remote/resolve-user.js';
import config from '@/config/index.js';
import { concat } from '@/prelude/array.js';
import { insertNoteUnread } from '@/services/note/unread.js';
import { extractMentions } from '@/misc/extract-mentions.js';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import { Note } from '@/models/entities/note.js';
import { Mutings, Users, NoteWatchings, Notes, Instances, UserProfiles, MutedNotes, Channels, ChannelFollowings, NoteThreadMutings } from '@/models/index.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { App } from '@/models/entities/app.js';
import { User, ILocalUser, IRemoteUser } from '@/models/entities/user.js';
import { genId } from '@/misc/gen-id.js';
import { notesChart, perUserNotesChart, activeUsersChart, instanceChart } from '@/services/chart/index.js';
import { Poll, IPoll } from '@/models/entities/poll.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { checkHitAntenna } from '@/misc/check-hit-antenna.js';
import { checkWordMute } from '@/misc/check-word-mute.js';
import { countSameRenotes } from '@/misc/count-same-renotes.js';
import { Channel } from '@/models/entities/channel.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { getAntennas } from '@/misc/antenna-cache.js';
import { endedPollNotificationQueue } from '@/queue/queues.js';
import { webhookDeliver } from '@/queue/index.js';
import { Cache } from '@/misc/cache.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { getActiveWebhooks } from '@/misc/webhook-cache.js';
import { IActivity } from '@/remote/activitypub/type.js';
import { renderNoteOrRenoteActivity } from '@/remote/activitypub/renderer/note-or-renote.js';
import { MINUTE } from '@/const.js';
import { updateHashtags } from '../update-hashtag.js';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc.js';
import { createNotification } from '../create-notification.js';
import { addNoteToAntenna } from '../add-note-to-antenna.js';
import { deliverToRelays } from '../relay.js';

const mutedWordsCache = new Cache<{ userId: UserProfile['userId']; mutedWords: UserProfile['mutedWords']; }[]>(
	5 * MINUTE,
	() => UserProfiles.find({
		where: {
			enableWordMute: true,
		},
		select: ['userId', 'mutedWords'],
	}),
);

type NotificationType = 'reply' | 'renote' | 'quote' | 'mention';

class NotificationManager {
	private notifier: { id: User['id']; };
	private note: Note;
	private queue: {
		target: ILocalUser['id'];
		reason: NotificationType;
	}[];

	constructor(notifier: { id: User['id']; }, note: Note) {
		this.notifier = notifier;
		this.note = note;
		this.queue = [];
	}

	public push(notifiee: ILocalUser['id'], reason: NotificationType): void {
		// No notification to yourself.
		if (this.notifier.id === notifiee) return;

		const exist = this.queue.find(x => x.target === notifiee);

		if (exist) {
			// If you have been "mentioned and replied to," make the notification as a reply, not as a mention.
			if (reason !== 'mention') {
				exist.reason = reason;
			}
		} else {
			this.queue.push({
				reason,
				target: notifiee,
			});
		}
	}

	public async deliver(): Promise<void> {
		for (const x of this.queue) {
			// check if the sender or thread are muted
			const userMuted = await Mutings.countBy({
				muterId: x.target,
				muteeId: this.notifier.id,
			});

			const threadMuted = await NoteThreadMutings.countBy({
				userId: x.target,
				threadId: In([
					// replies
					this.note.threadId ?? this.note.id,
					// renotes
					this.note.renoteId ?? undefined,
				]),
				mutingNotificationTypes: ArrayOverlap([x.reason]),
			});

			if (!userMuted && !threadMuted) {
				createNotification(x.target, x.reason, {
					notifierId: this.notifier.id,
					noteId: this.note.id,
				});
			}
		}
	}
}

type MinimumUser = {
	id: User['id'];
	host: User['host'];
	username: User['username'];
	uri: User['uri'];
};

type Option = {
	createdAt?: Date | null;
	name?: string | null;
	text?: string | null;
	reply?: Note | null;
	renote?: Note | null;
	files?: DriveFile[] | null;
	poll?: IPoll | null;
	localOnly?: boolean | null;
	cw?: string | null;
	visibility?: 'home' | 'public' | 'followers' | 'specified';
	visibleUsers?: MinimumUser[] | null;
	channel?: Channel | null;
	apMentions?: MinimumUser[] | null;
	apHashtags?: string[] | null;
	apEmojis?: string[] | null;
	uri?: string | null;
	url?: string | null;
	app?: App | null;
};

export default async (user: { id: User['id']; username: User['username']; host: User['host']; isSilenced: User['isSilenced']; createdAt: User['createdAt']; }, data: Option, silent = false): Promise<Note> => new Promise<Note>(async (res, rej) => {
	// If you reply outside the channel, adjust to the scope of the target
	// (I think this could be done client-side, but server-side for now)
	if (data.reply && data.channel && data.reply.channelId !== data.channel.id) {
		if (data.reply.channelId) {
			data.channel = await Channels.findOneBy({ id: data.reply.channelId });
		} else {
			data.channel = null;
		}
	}

	// When you reply to a channel, adjust the scope to that of the target.
	// (I think this could be done client-side, but server-side for now)
	if (data.reply?.channelId && (data.channel == null)) {
		data.channel = await Channels.findOneBy({ id: data.reply.channelId });
	}

	if (data.createdAt == null) data.createdAt = new Date();
	if (data.visibility == null) data.visibility = 'public';
	if (data.localOnly == null) data.localOnly = false;
	if (data.channel != null) data.visibility = 'public';
	if (data.channel != null) data.visibleUsers = [];
	if (data.channel != null) data.localOnly = true;

	// silence
	if (user.isSilenced && data.visibility === 'public' && data.channel == null) {
		data.visibility = 'home';
	}

	// Reject if the target of the renote is not Home or Public.
	if (data.renote && data.renote.visibility !== 'public' && data.renote.visibility !== 'home' && data.renote.userId !== user.id) {
		return rej('Renote target is not public or home');
	}

	// If the target of the renote is not public, make it home.
	if (data.renote && data.renote.visibility !== 'public' && data.visibility === 'public') {
		data.visibility = 'home';
	}

	// If the target of Renote is followers, make it followers.
	if (data.renote && data.renote.visibility === 'followers') {
		data.visibility = 'followers';
	}

	// Ff the original note is local-only, make the renote also local-only.
	if (data.renote && data.renote.localOnly && data.channel == null) {
		data.localOnly = true;
	}

	// If you reply to local only, make it local only.
	if (data.reply && data.reply.localOnly && data.channel == null) {
		data.localOnly = true;
	}

	if (data.text) {
		data.text = data.text.trim();
	} else {
		data.text = null;
	}

	let tags = data.apHashtags;
	let emojis = data.apEmojis;
	let mentionedUsers = data.apMentions;

	// Parse MFM if needed
	if (!tags || !emojis || !mentionedUsers) {
		const tokens = data.text ? mfm.parse(data.text) : [];
		const cwTokens = data.cw ? mfm.parse(data.cw) : [];
		const choiceTokens = data.poll?.choices
			? concat(data.poll.choices.map(choice => mfm.parse(choice)))
			: [];

		const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

		tags = data.apHashtags || extractHashtags(combinedTokens);

		emojis = data.apEmojis || extractCustomEmojisFromMfm(combinedTokens);

		mentionedUsers = data.apMentions || await extractMentionedUsers(user, combinedTokens);
	}

	tags = tags.filter(tag => Array.from(tag || '').length <= 128).splice(0, 32);

	if (data.reply && (user.id !== data.reply.userId) && !mentionedUsers.some(u => u.id === data.reply?.userId)) {
		mentionedUsers.push(await Users.findOneByOrFail({ id: data.reply.userId }));
	}

	if (data.visibility === 'specified') {
		if (data.visibleUsers == null) throw new Error('invalid param');

		for (const u of data.visibleUsers) {
			if (!mentionedUsers.some(x => x.id === u.id)) {
				mentionedUsers.push(u);
			}
		}

		if (data.reply && !data.visibleUsers.some(x => x.id === data.reply?.userId)) {
			data.visibleUsers.push(await Users.findOneByOrFail({ id: data.reply.userId }));
		}
	}

	const note = await insertNote(user, data, tags, emojis, mentionedUsers);

	res(note);

	// Update Statistics
	notesChart.update(note, true);
	perUserNotesChart.update(user, note, true);

	// Register host
	if (Users.isRemoteUser(user)) {
		registerOrFetchInstanceDoc(user.host).then(i => {
			Instances.increment({ id: i.id }, 'notesCount', 1);
			instanceChart.updateNote(i.host, note, true);
		});
	}

	// Hashtag Update
	if (data.visibility === 'public' || data.visibility === 'home') {
		updateHashtags(user, tags);
	}

	// Increment notes count (user)
	incNotesCountOfUser(user);

	// Word mute
	mutedWordsCache.fetch('').then(us => {
		for (const u of us) {
			checkWordMute(note, { id: u.userId }, u.mutedWords).then(shouldMute => {
				if (shouldMute) {
					MutedNotes.insert({
						id: genId(),
						userId: u.userId,
						noteId: note.id,
						reason: 'word',
					});
				}
			});
		}
	});

	// Antenna
	for (const antenna of (await getAntennas())) {
		checkHitAntenna(antenna, note, user).then(hit => {
			if (hit) {
				addNoteToAntenna(antenna, note, user);
			}
		});
	}

	// Channel
	if (note.channelId) {
		ChannelFollowings.findBy({ followeeId: note.channelId }).then(followings => {
			for (const following of followings) {
				insertNoteUnread(following.followerId, note, {
					isSpecified: false,
					isMentioned: false,
				});
			}
		});
	}

	if (data.reply) {
		saveReply(data.reply, note);
	}

	// When there is no re-note of the specified note by the specified user except for this post
	if (data.renote && (await countSameRenotes(user.id, data.renote.id, note.id) === 0)) {
		incRenoteCount(data.renote);
	}

	if (data.poll && data.poll.expiresAt) {
		const delay = data.poll.expiresAt.getTime() - Date.now();
		endedPollNotificationQueue.add({
			noteId: note.id,
		}, {
			delay,
			removeOnComplete: true,
		});
	}

	if (!silent) {
		if (Users.isLocalUser(user)) activeUsersChart.write(user);

		// Create unread notifications
		if (data.visibility === 'specified') {
			if (data.visibleUsers == null) throw new Error('invalid param');

			for (const u of data.visibleUsers) {
				// Local users only
				if (!Users.isLocalUser(u)) continue;

				insertNoteUnread(u.id, note, {
					isSpecified: true,
					isMentioned: false,
				});
			}
		} else {
			for (const u of mentionedUsers) {
				// Local users only
				if (!Users.isLocalUser(u)) continue;

				insertNoteUnread(u.id, note, {
					isSpecified: false,
					isMentioned: true,
				});
			}
		}

		publishNotesStream(note);

		const webhooks = await getActiveWebhooks().then(webhooks => webhooks.filter(x => x.userId === user.id && x.on.includes('note')));

		for (const webhook of webhooks) {
			webhookDeliver(webhook, 'note', {
				note: await Notes.pack(note, user),
			});
		}

		const nm = new NotificationManager(user, note);
		const nmRelatedPromises = [];

		await createMentionedEvents(mentionedUsers, note, nm);

		// If has in reply to note
		if (data.reply) {
			// Fetch watchers
			nmRelatedPromises.push(notifyToWatchersOfReplyee(data.reply, user, nm));

			// 通知
			if (data.reply.userHost === null) {
				const threadMuted = await NoteThreadMutings.countBy({
					userId: data.reply.userId,
					threadId: data.reply.threadId || data.reply.id,
				});

				if (!threadMuted) {
					nm.push(data.reply.userId, 'reply');

					const packedReply = await Notes.pack(note, { id: data.reply.userId });
					publishMainStream(data.reply.userId, 'reply', packedReply);

					const webhooks = (await getActiveWebhooks()).filter(x => x.userId === data.reply!.userId && x.on.includes('reply'));
					for (const webhook of webhooks) {
						webhookDeliver(webhook, 'reply', {
							note: packedReply,
						});
					}
				}
			}
		}

		// If it is renote
		if (data.renote) {
			const type = data.text ? 'quote' : 'renote';

			// Notify
			if (data.renote.userHost === null) {
				nm.push(data.renote.userId, type);
			}

			// Fetch watchers
			nmRelatedPromises.push(notifyToWatchersOfRenotee(data.renote, user, nm, type));

			// Publish event
			if ((user.id !== data.renote.userId) && data.renote.userHost === null) {
				const packedRenote = await Notes.pack(note, { id: data.renote.userId });
				publishMainStream(data.renote.userId, 'renote', packedRenote);

				const webhooks = (await getActiveWebhooks()).filter(x => x.userId === data.renote!.userId && x.on.includes('renote'));
				for (const webhook of webhooks) {
					webhookDeliver(webhook, 'renote', {
						note: packedRenote,
					});
				}
			}
		}

		Promise.all(nmRelatedPromises).then(() => {
			nm.deliver();
		});

		//#region AP deliver
		if (Users.isLocalUser(user) && !data.localOnly) {
			(async () => {
				const noteActivity = renderActivity(await renderNoteOrRenoteActivity(note));
				const dm = new DeliverManager(user, noteActivity);

				// Delivered to remote users who have been mentioned
				for (const u of mentionedUsers.filter(u => Users.isRemoteUser(u))) {
					dm.addDirectRecipe(u as IRemoteUser);
				}

				// If the post is a reply and the poster is a local user and the poster of the post to which you are replying is a remote user, deliver
				if (data.reply && data.reply.userHost !== null) {
					const u = await Users.findOneBy({ id: data.reply.userId });
					if (u && Users.isRemoteUser(u)) dm.addDirectRecipe(u);
				}

				// If the post is a Renote and the poster is a local user and the poster of the original Renote post is a remote user, deliver
				if (data.renote && data.renote.userHost !== null) {
					const u = await Users.findOneBy({ id: data.renote.userId });
					if (u && Users.isRemoteUser(u)) dm.addDirectRecipe(u);
				}

				// Deliver to followers
				if (['public', 'home', 'followers'].includes(note.visibility)) {
					dm.addFollowersRecipe();
				}

				if (['public'].includes(note.visibility)) {
					deliverToRelays(user, noteActivity);
				}

				dm.execute();
			})();
		}
		//#endregion
	}

	if (data.channel) {
		Channels.increment({ id: data.channel.id }, 'notesCount', 1);
		Channels.update(data.channel.id, {
			lastNotedAt: new Date(),
		});

		const count = await Notes.countBy({
			userId: user.id,
			channelId: data.channel.id,
		});

		// This process takes place after the note is created, so if there is only one note, you can determine that it is the first submission.
		// TODO: but there's also the messiness of deleting a note and posting it multiple times, which is incremented by the number of times it's posted, so I'd like to do something about that.
		if (count === 1) {
			Channels.increment({ id: data.channel.id }, 'usersCount', 1);
		}
	}

	// Register to search database
	index(note);
});

function incRenoteCount(renote: Note): void {
	Notes.createQueryBuilder().update()
		.set({
			renoteCount: () => '"renoteCount" + 1',
			score: () => '"score" + 1',
		})
		.where('id = :id', { id: renote.id })
		.execute();
}

async function insertNote(user: { id: User['id']; host: User['host']; }, data: Option, tags: string[], emojis: string[], mentionedUsers: MinimumUser[]): Promise<Note> {
	const createdAt = data.createdAt ?? new Date();

	const insert = new Note({
		id: genId(createdAt),
		createdAt,
		fileIds: data.files?.map(file => file.id) ?? [],
		replyId: data.reply?.id ?? null,
		renoteId: data.renote?.id ?? null,
		channelId: data.channel?.id ?? null,
		threadId: data.reply?.threadId ?? data.reply?.id ?? null,
		name: data.name,
		text: data.text,
		hasPoll: data.poll != null,
		cw: data.cw ?? null,
		tags: tags.map(tag => normalizeForSearch(tag)),
		emojis,
		userId: user.id,
		localOnly: data.localOnly ?? false,
		visibility: data.visibility,
		visibleUserIds: data.visibility === 'specified'
			? data.visibleUsers?.map(u => u.id) ?? []
			: [],

		attachedFileTypes: data.files?.map(file => file.type) ?? [],

		// denormalized data below
		replyUserId: data.reply?.userId,
		replyUserHost: data.reply?.userHost,
		renoteUserId: data.renote?.userId,
		renoteUserHost: data.renote?.userHost,
		userHost: user.host,
	});

	if (data.uri != null) insert.uri = data.uri;
	if (data.url != null) insert.url = data.url;

	// Append mentions data
	if (mentionedUsers.length > 0) {
		insert.mentions = mentionedUsers.map(u => u.id);
	}

	// Create a post
	try {
		// Start transaction
		await db.transaction(async transactionalEntityManager => {
			await transactionalEntityManager.insert(Note, insert);

			if (data.poll != null) {
				const poll = new Poll({
					noteId: insert.id,
					choices: data.poll.choices,
					expiresAt: data.poll.expiresAt,
					multiple: data.poll.multiple,
					votes: new Array(data.poll.choices.length).fill(0),
					noteVisibility: insert.visibility,
					userId: user.id,
					userHost: user.host,
				});
				await transactionalEntityManager.insert(Poll, poll);
			}
		});

		return insert;
	} catch (e) {
		// duplicate key error
		if (isDuplicateKeyValueError(e)) {
			const err = new Error('Duplicated note');
			err.name = 'duplicated';
			throw err;
		}

		console.error(e);

		throw e;
	}
}

function index(note: Note): void {
	if (note.text == null || config.elasticsearch == null) return;

	es.index({
		index: config.elasticsearch.index || 'misskey_note',
		id: note.id.toString(),
		body: {
			text: normalizeForSearch(note.text),
			userId: note.userId,
			userHost: note.userHost,
		},
	});
}

async function notifyToWatchersOfRenotee(renote: Note, user: { id: User['id']; }, nm: NotificationManager, type: NotificationType): Promise<void> {
	const watchers = await NoteWatchings.findBy({
		noteId: renote.id,
		userId: Not(user.id),
	});

	for (const watcher of watchers) {
		nm.push(watcher.userId, type);
	}
}

async function notifyToWatchersOfReplyee(reply: Note, user: { id: User['id']; }, nm: NotificationManager): Promise<void> {
	const watchers = await NoteWatchings.findBy({
		noteId: reply.id,
		userId: Not(user.id),
	});

	for (const watcher of watchers) {
		nm.push(watcher.userId, 'reply');
	}
}

async function createMentionedEvents(mentionedUsers: MinimumUser[], note: Note, nm: NotificationManager): Promise<void> {
	for (const u of mentionedUsers.filter(u => Users.isLocalUser(u))) {
		const threadMuted = await NoteThreadMutings.countBy({
			userId: u.id,
			threadId: note.threadId || note.id,
		});

		if (threadMuted) {
			continue;
		}

		// note with "specified" visibility might not be visible to mentioned users
		try {
			const detailPackedNote = await Notes.pack(note, u, {
				detail: true,
			});

			publishMainStream(u.id, 'mention', detailPackedNote);

			const webhooks = (await getActiveWebhooks()).filter(x => x.userId === u.id && x.on.includes('mention'));
			for (const webhook of webhooks) {
				webhookDeliver(webhook, 'mention', {
					note: detailPackedNote,
				});
			}
		} catch (err) {
			if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') continue;
			throw err;
		}

		// Create notification
		nm.push(u.id, 'mention');
	}
}

function saveReply(reply: Note): void {
	Notes.increment({ id: reply.id }, 'repliesCount', 1);
}

function incNotesCountOfUser(user: { id: User['id']; }): void {
	Users.createQueryBuilder().update()
		.set({
			updatedAt: new Date(),
			notesCount: () => '"notesCount" + 1',
		})
		.where('id = :id', { id: user.id })
		.execute();
}

async function extractMentionedUsers(user: { host: User['host']; }, tokens: mfm.MfmNode[]): Promise<User[]> {
	if (tokens.length === 0) return [];

	const mentions = extractMentions(tokens);

	let mentionedUsers = (await Promise.all(mentions.map(m =>
		resolveUser(m.username, m.host || user.host).catch(() => null),
	))).filter(x => x != null) as User[];

	// Drop duplicate users
	mentionedUsers = mentionedUsers.filter((u, i, self) =>
		i === self.findIndex(u2 => u.id === u2.id),
	);

	return mentionedUsers;
}
