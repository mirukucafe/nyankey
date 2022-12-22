import RE2 from 're2';
import * as mfm from 'mfm-js';
import { notificationTypes } from 'foundkey-js';
import { publishMainStream, publishUserEvent } from '@/services/stream.js';
import { acceptAllFollowRequests } from '@/services/following/requests/accept-all.js';
import { publishToFollowers } from '@/services/i/update.js';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import { updateUsertags } from '@/services/update-hashtag.js';
import { Users, DriveFiles, UserProfiles, Pages } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { langmap } from '@/misc/langmap.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	errors: ['INVALID_REGEXP', 'NO_SUCH_FILE', 'NO_SUCH_PAGE', 'NOT_AN_IMAGE'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { ...Users.nameSchema, nullable: true },
		description: { ...Users.descriptionSchema, nullable: true },
		location: { ...Users.locationSchema, nullable: true },
		birthday: { ...Users.birthdaySchema, nullable: true },
		lang: { type: 'string', enum: [null, ...Object.keys(langmap)], nullable: true },
		avatarId: { type: 'string', format: 'misskey:id', nullable: true },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
		fields: {
			type: 'array',
			minItems: 0,
			maxItems: 16,
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					value: { type: 'string' },
				},
				required: ['name', 'value'],
			},
		},
		isLocked: { type: 'boolean' },
		isExplorable: { type: 'boolean' },
		hideOnlineStatus: { type: 'boolean' },
		publicReactions: { type: 'boolean' },
		carefulBot: { type: 'boolean' },
		autoAcceptFollowed: { type: 'boolean' },
		noCrawle: { type: 'boolean' },
		isBot: { type: 'boolean' },
		isCat: { type: 'boolean' },
		showTimelineReplies: { type: 'boolean' },
		injectFeaturedNote: { type: 'boolean' },
		receiveAnnouncementEmail: { type: 'boolean' },
		alwaysMarkNsfw: { type: 'boolean' },
		ffVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
		pinnedPageId: { type: 'array', items: {
			type: 'string', format: 'misskey:id',
		} },
		mutedWords: { type: 'array' },
		mutedInstances: { type: 'array', items: {
			type: 'string',
		} },
		mutingNotificationTypes: { type: 'array', items: {
			type: 'string', enum: notificationTypes,
		} },
		emailNotificationTypes: { type: 'array', items: {
			type: 'string',
		} },
		federateBlocks: { type: 'boolean' },
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, _user, token) => {
	const user = await Users.findOneByOrFail({ id: _user.id });
	const isSecure = token == null;

	const updates = {} as Partial<User>;
	const profileUpdates = {} as Partial<UserProfile>;

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (ps.name !== undefined) updates.name = ps.name;
	if (ps.description !== undefined) profileUpdates.description = ps.description;
	if (ps.lang !== undefined) profileUpdates.lang = ps.lang;
	if (ps.location !== undefined) profileUpdates.location = ps.location;
	if (ps.birthday !== undefined) profileUpdates.birthday = ps.birthday;
	if (ps.ffVisibility !== undefined) profileUpdates.ffVisibility = ps.ffVisibility;
	if (ps.avatarId !== undefined) updates.avatarId = ps.avatarId;
	if (ps.bannerId !== undefined) updates.bannerId = ps.bannerId;
	if (ps.mutedWords !== undefined) {
		// validate regular expression syntax
		ps.mutedWords.filter(x => !Array.isArray(x)).forEach(x => {
			const regexp = x.match(/^\/(.+)\/(.*)$/);
			if (!regexp) throw new ApiError('INVALID_REGEXP');

			try {
				new RE2(regexp[1], regexp[2]);
			} catch (err) {
				throw new ApiError('INVALID_REGEXP');
			}
		});

		profileUpdates.mutedWords = ps.mutedWords;
		profileUpdates.enableWordMute = ps.mutedWords.length > 0;
	}
	if (ps.mutedInstances !== undefined) profileUpdates.mutedInstances = ps.mutedInstances;
	if (ps.mutingNotificationTypes !== undefined) profileUpdates.mutingNotificationTypes = ps.mutingNotificationTypes as typeof notificationTypes[number][];
	if (typeof ps.isLocked === 'boolean') updates.isLocked = ps.isLocked;
	if (typeof ps.isExplorable === 'boolean') updates.isExplorable = ps.isExplorable;
	if (typeof ps.hideOnlineStatus === 'boolean') updates.hideOnlineStatus = ps.hideOnlineStatus;
	if (typeof ps.publicReactions === 'boolean') profileUpdates.publicReactions = ps.publicReactions;
	if (typeof ps.isBot === 'boolean') updates.isBot = ps.isBot;
	if (typeof ps.showTimelineReplies === 'boolean') updates.showTimelineReplies = ps.showTimelineReplies;
	if (typeof ps.carefulBot === 'boolean') profileUpdates.carefulBot = ps.carefulBot;
	if (typeof ps.autoAcceptFollowed === 'boolean') profileUpdates.autoAcceptFollowed = ps.autoAcceptFollowed;
	if (typeof ps.noCrawle === 'boolean') profileUpdates.noCrawle = ps.noCrawle;
	if (typeof ps.federateBlocks === 'boolean') updates.federateBlocks = ps.federateBlocks;
	if (typeof ps.isCat === 'boolean') updates.isCat = ps.isCat;
	if (typeof ps.injectFeaturedNote === 'boolean') profileUpdates.injectFeaturedNote = ps.injectFeaturedNote;
	if (typeof ps.receiveAnnouncementEmail === 'boolean') profileUpdates.receiveAnnouncementEmail = ps.receiveAnnouncementEmail;
	if (typeof ps.alwaysMarkNsfw === 'boolean') profileUpdates.alwaysMarkNsfw = ps.alwaysMarkNsfw;
	if (ps.emailNotificationTypes !== undefined) profileUpdates.emailNotificationTypes = ps.emailNotificationTypes;

	if (ps.avatarId) {
		const avatar = await DriveFiles.findOneBy({ id: ps.avatarId });

		if (avatar == null || avatar.userId !== user.id) throw new ApiError('NO_SUCH_FILE', 'Avatar file not found.');
		if (!avatar.type.startsWith('image/')) throw new ApiError('NOT_AN_IMAGE', 'Avatar file is not an image.');
	}

	if (ps.bannerId) {
		const banner = await DriveFiles.findOneBy({ id: ps.bannerId });

		if (banner == null || banner.userId !== user.id) throw new ApiError('NO_SUCH_FILE', 'Banner file not found.');
		if (!banner.type.startsWith('image/')) throw new ApiError('BANNER_NOT_AN_IMAGE', 'Banner file is not an image.');
	}

	if (ps.pinnedPageId) {
		const page = await Pages.findOneBy({ id: ps.pinnedPageId });

		if (page == null || page.userId !== user.id) throw new ApiError('NO_SUCH_PAGE');

		profileUpdates.pinnedPageId = page.id;
	} else if (ps.pinnedPageId === null) {
		profileUpdates.pinnedPageId = null;
	}

	if (ps.fields) {
		profileUpdates.fields = ps.fields
			.filter(x => typeof x.name === 'string' && x.name !== '' && typeof x.value === 'string' && x.value !== '')
			.map(x => {
				return { name: x.name, value: x.value };
			});
	}

	//#region emojis/tags

	let emojis = [] as string[];
	let tags = [] as string[];

	const newName = updates.name === undefined ? user.name : updates.name;
	const newDescription = profileUpdates.description === undefined ? profile.description : profileUpdates.description;

	if (newName != null) {
		const tokens = mfm.parsePlain(newName);
		emojis = emojis.concat(extractCustomEmojisFromMfm(tokens!));
	}

	if (newDescription != null) {
		const tokens = mfm.parse(newDescription);
		emojis = emojis.concat(extractCustomEmojisFromMfm(tokens!));
		tags = extractHashtags(tokens!).map(tag => normalizeForSearch(tag)).splice(0, 32);
	}

	updates.emojis = emojis;
	updates.tags = tags;

	// ハッシュタグ更新
	updateUsertags(user, tags);
	//#endregion

	if (Object.keys(updates).length > 0) await Users.update(user.id, updates);
	if (Object.keys(profileUpdates).length > 0) await UserProfiles.update(user.id, profileUpdates);

	const iObj = await Users.pack<true, true>(user.id, user, {
		detail: true,
		includeSecrets: isSecure,
	});

	// Publish meUpdated event
	publishMainStream(user.id, 'meUpdated', iObj);
	publishUserEvent(user.id, 'updateUserProfile', await UserProfiles.findOneBy({ userId: user.id }));

	// 鍵垢を解除したとき、溜まっていたフォローリクエストがあるならすべて承認
	if (user.isLocked && ps.isLocked === false) {
		acceptAllFollowRequests(user);
	}

	// フォロワーにUpdateを配信
	publishToFollowers(user.id);

	return iObj;
});
