import { In, IsNull } from 'typeorm';
import config from '@/config/index.js';
import { Note } from '@/models/entities/note.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { DriveFiles, Notes, Users, Emojis, Polls } from '@/models/index.js';
import { Emoji } from '@/models/entities/emoji.js';
import { Poll } from '@/models/entities/poll.js';
import { toHtml } from '@/mfm/to-html.js';
import renderEmoji from './emoji.js';
import renderMention from './mention.js';
import renderHashtag from './hashtag.js';
import renderDocument from './document.js';

export default async function renderNote(note: Note, dive = true, isTalk = false): Promise<Record<string, unknown>> {
	const getPromisedFiles = async (ids: string[]) => {
		if (!ids || ids.length === 0) return [];
		const items = await DriveFiles.findBy({ id: In(ids) });
		return ids.map(id => items.find(item => item.id === id)).filter(item => item != null) as DriveFile[];
	};

	let inReplyTo;
	let inReplyToNote: Note | null;

	if (note.replyId) {
		inReplyToNote = await Notes.findOneBy({ id: note.replyId });

		if (inReplyToNote != null) {
			const inReplyToUserExists = await Users.countBy({ id: inReplyToNote.userId });

			if (inReplyToUserExists) {
				if (inReplyToNote.uri) {
					inReplyTo = inReplyToNote.uri;
				} else {
					if (dive) {
						inReplyTo = await renderNote(inReplyToNote, false);
					} else {
						inReplyTo = `${config.url}/notes/${inReplyToNote.id}`;
					}
				}
			}
		}
	} else {
		inReplyTo = null;
	}

	let quote;

	if (note.renoteId) {
		const renote = await Notes.findOneBy({ id: note.renoteId });

		if (renote) {
			quote = renote.uri ? renote.uri : `${config.url}/notes/${renote.id}`;
		}
	}

	const attributedTo = `${config.url}/users/${note.userId}`;

	const mentionedUsers = note.mentions.length > 0 ? await Users.findBy({
		id: In(note.mentions),
	}) : [];

	const mentionUris = mentionedUsers
		// only remote users
		.filter(user => Users.isRemoteUser(user))
		.map(user => user.uri);

	let to: string[] = [];
	let cc: string[] = [];

	if (note.visibility === 'public') {
		to = ['https://www.w3.org/ns/activitystreams#Public'];
		cc = [`${attributedTo}/followers`].concat(mentionUris);
	} else if (note.visibility === 'home') {
		to = [`${attributedTo}/followers`];
		cc = ['https://www.w3.org/ns/activitystreams#Public'].concat(mentionUris);
	} else if (note.visibility === 'followers') {
		to = [`${attributedTo}/followers`];
		cc = mentionUris;
	} else {
		to = mentionUris;
	}

	const hashtagTags = (note.tags || []).map(tag => renderHashtag(tag));
	const mentionTags = mentionedUsers.map(u => renderMention(u));

	const files = await getPromisedFiles(note.fileIds);

	const text = note.text ?? '';
	let poll: Poll | null = null;

	if (note.hasPoll) {
		poll = await Polls.findOneBy({ noteId: note.id });
	}

	let apText = text;

	if (quote) {
		apText += `\n\nRE: ${quote}`;
	}

	const summary = note.cw === '' ? String.fromCharCode(0x200B) : note.cw;

	const content = await toHtml(apText, note.mentions);

	const emojis = await getEmojis(note.emojis);
	const apemojis = emojis.map(emoji => renderEmoji(emoji));

	const tag = [
		...hashtagTags,
		...mentionTags,
		...apemojis,
	];

	if (quote) {
		tag.push({
			type: 'Link',
			mediaType: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
			href: quote,
			name: `RE: ${quote}`,
			rel: 'https://misskey-hub.net/ns#_misskey_quote',
		});
	}

	const asPoll = poll ? {
		type: 'Question',
		content: await toHtml(text, note.mentions),
		[poll.expiresAt && poll.expiresAt < new Date() ? 'closed' : 'endTime']: poll.expiresAt,
		[poll.multiple ? 'anyOf' : 'oneOf']: poll.choices.map((text, i) => ({
			type: 'Note',
			name: text,
			replies: {
				type: 'Collection',
				totalItems: poll!.votes[i],
			},
		})),
	} : {};

	const asTalk = isTalk ? {
		_misskey_talk: true,
	} : {};

	return {
		id: `${config.url}/notes/${note.id}`,
		type: 'Note',
		attributedTo,
		summary,
		content,
		source: {
			content: text,
			mediaType: 'text/x.misskeymarkdown',
		},
		_misskey_quote: quote,
		quoteUri: quote,
		published: note.createdAt.toISOString(),
		to,
		cc,
		inReplyTo,
		attachment: files.map(renderDocument),
		sensitive: note.cw != null || files.some(file => file.isSensitive),
		tag,
		...asPoll,
		...asTalk,
	};
}

export async function getEmojis(names: string[]): Promise<Emoji[]> {
	if (names == null || names.length === 0) return [];

	const emojis = await Promise.all(
		names.map(name => Emojis.findOneBy({
			name,
			host: IsNull(),
		})),
	);

	return emojis.filter(emoji => emoji != null) as Emoji[];
}
