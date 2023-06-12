import {
	Announcement, Antenna, App, AuthSession, Blocking, Channel, Clip, DateString, InstanceMetadata, DriveFile, DriveFolder, Following, FollowingFolloweePopulated, FollowingFollowerPopulated, FollowRequest, Instance,
	MeDetailed,
	Note, OriginType, Page, ServerInfo, Stats, User, UserDetailed, UserGroup, UserList, UserSorting, Notification, NoteReaction, Signin, MessagingMessage,
} from './entities.js';

type TODO = Record<string, any> | null;

type NoParams = Record<string, never>;

type ShowUserReq = { username: string; host?: string; } | { userId: User['id']; };

export type Endpoints = {
	'admin/meta': { req: TODO; res: TODO; };
	'admin/announcements/create': { req: TODO; res: TODO; };
	'admin/announcements/delete': { req: { id: Announcement['id'] }; res: null; };
	'admin/announcements/list': { req: TODO; res: TODO; };
	'admin/announcements/update': { req: TODO; res: TODO; };
	'admin/drive/clean-remote-files': { req: TODO; res: TODO; };
	'admin/drive/files': { req: TODO; res: TODO; };
	'admin/drive/show-file': { req: TODO; res: TODO; };
	'admin/emoji/add-aliases-bulk': { req: TODO; res: TODO; };
	'admin/emoji/add': { req: TODO; res: TODO; };
	'admin/emoji/copy': { req: TODO; res: TODO; };
	'admin/emoji/delete-bulk': { req: TODO; res: TODO; };
	'admin/emoji/delete': { req: TODO; res: TODO; };
	'admin/emoji/import-zip': { req: TODO; res: TODO; };
	'admin/emoji/list-remote': { req: TODO; res: TODO; };
	'admin/emoji/list': { req: TODO; res: TODO; };
	'admin/emoji/remove-aliases-bulk': { req: TODO; res: TODO; };
	'admin/emoji/set-aliases-bulk': { req: TODO; res: TODO; };
	'admin/emoji/set-category-bulk': { req: TODO; res: TODO; };
	'admin/emoji/update': { req: TODO; res: TODO; };
	'admin/federation/delete-all-files': { req: { host: string }; res: null; };
	'admin/federation/refresh-remote-instance-metadata': { req: TODO; res: TODO; };
	'admin/federation/remove-all-following': { req: TODO; res: TODO; };
	'admin/federation/update-instance': { req: TODO; res: TODO; };
	'admin/get-index-stats': { req: TODO; res: TODO; };
	'admin/get-table-stats': { req: TODO; res: TODO; };
	'admin/invite': { req: TODO; res: TODO; };
	'admin/moderators/add': { req: TODO; res: TODO; };
	'admin/moderators/remove': { req: TODO; res: TODO; };
	'admin/queue/clear': { req: TODO; res: TODO; };
	'admin/queue/deliver-delayed': { req: TODO; res: TODO; };
	'admin/queue/inbox-delayed': { req: TODO; res: TODO; };
	'admin/queue/stats': { req: TODO; res: TODO; };
	'admin/relays/add': { req: TODO; res: TODO; };
	'admin/relays/list': { req: TODO; res: TODO; };
	'admin/relays/remove': { req: TODO; res: TODO; };
	'admin/reports/list': { req: TODO; res: TODO; };
	'admin/reports/resolve': { req: TODO; res: TODO; };
	'admin/send-email': { req: TODO; res: TODO; };
	'admin/server-info': { req: TODO; res: TODO; };
	'admin/show-moderation-logs': { req: TODO; res: TODO; };
	'admin/users': { req: TODO; res: TODO; };
	'admin/users/create': { req: TODO; res: TODO; };
	'admin/users/delete': { req: TODO; res: TODO; };
	'admin/users/delete-all-files': { req: { userId: User['id']; }; res: null; };
	'admin/users/reset-password': { req: TODO; res: TODO; };
	'admin/users/show': { req: TODO; res: TODO; };
	'admin/users/silence': { req: TODO; res: TODO; };
	'admin/users/suspend': { req: TODO; res: TODO; };
	'admin/users/unsilence': { req: TODO; res: TODO; };
	'admin/users/unsuspend': { req: TODO; res: TODO; };
	'admin/update-meta': { req: TODO; res: TODO; };
	'admin/vacuum': { req: TODO; res: TODO; };
	'announcements': { req: { limit?: number; withUnreads?: boolean; sinceId?: Announcement['id']; untilId?: Announcement['id']; }; res: Announcement[]; };
	'antennas/create': { req: TODO; res: Antenna; };
	'antennas/delete': { req: { antennaId: Antenna['id']; }; res: null; };
	'antennas/list': { req: NoParams; res: Antenna[]; };
	'antennas/notes': { req: { antennaId: Antenna['id']; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; }; res: Note[]; };
	'antennas/show': { req: { antennaId: Antenna['id']; }; res: Antenna; };
	'antennas/update': { req: TODO; res: Antenna; };
	'ap/get': { req: { uri: string; }; res: Record<string, any>; };
	'ap/show': { req: { uri: string; }; res: {
		type: 'Note';
		object: Note;
	} | {
		type: 'User';
		object: UserDetailed;
	}; };
	'app/create': { req: TODO; res: App; };
	'app/show': { req: { appId: App['id']; }; res: App; };
	'auth/accept': { req: { token: string; }; res: null; };
	'auth/session/generate': { req: { appSecret: string; }; res: { token: string; url: string; }; };
	'auth/session/show': { req: { token: string; }; res: AuthSession; };
	'auth/session/userkey': { req: { appSecret: string; token: string; }; res: { accessToken: string; user: User }; };
	'blocking/create': { req: { userId: User['id'] }; res: UserDetailed; };
	'blocking/delete': { req: { userId: User['id'] }; res: UserDetailed; };
	'blocking/list': { req: { limit?: number; sinceId?: Blocking['id']; untilId?: Blocking['id']; }; res: Blocking[]; };
	'channels/create': { req: TODO; res: TODO; };
	'channels/featured': { req: TODO; res: TODO; };
	'channels/follow': { req: TODO; res: TODO; };
	'channels/followed': { req: TODO; res: TODO; };
	'channels/owned': { req: TODO; res: TODO; };
	'channels/show': { req: TODO; res: TODO; };
	'channels/timeline': { req: TODO; res: TODO; };
	'channels/unfollow': { req: TODO; res: TODO; };
	'channels/update': { req: TODO; res: TODO; };
	'charts/active-users': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		local: {
			users: number[];
		};
		remote: {
			users: number[];
		};
	}; };
	'charts/ap-request': { req: TODO; res: TODO; };
	'charts/drive': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		local: {
			decCount: number[];
			decSize: number[];
			incCount: number[];
			incSize: number[];
			totalCount: number[];
			totalSize: number[];
		};
		remote: {
			decCount: number[];
			decSize: number[];
			incCount: number[];
			incSize: number[];
			totalCount: number[];
			totalSize: number[];
		};
	}; };
	'charts/federation': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		instance: {
			dec: number[];
			inc: number[];
			total: number[];
		};
	}; };
	'charts/hashtag': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: TODO; };
	'charts/instance': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; host: string; }; res: {
		drive: {
			decFiles: number[];
			decUsage: number[];
			incFiles: number[];
			incUsage: number[];
			totalFiles: number[];
			totalUsage: number[];
		};
		followers: {
			dec: number[];
			inc: number[];
			total: number[];
		};
		following: {
			dec: number[];
			inc: number[];
			total: number[];
		};
		notes: {
			dec: number[];
			inc: number[];
			total: number[];
			diffs: {
				normal: number[];
				renote: number[];
				reply: number[];
			};
		};
		requests: {
			failed: number[];
			received: number[];
			succeeded: number[];
		};
		users: {
			dec: number[];
			inc: number[];
			total: number[];
		};
	}; };
	'charts/notes': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		local: {
			dec: number[];
			inc: number[];
			total: number[];
			diffs: {
				normal: number[];
				renote: number[];
				reply: number[];
			};
		};
		remote: {
			dec: number[];
			inc: number[];
			total: number[];
			diffs: {
				normal: number[];
				renote: number[];
				reply: number[];
			};
		};
	}; };
	'charts/user/drive': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; userId: User['id']; }; res: {
		decCount: number[];
		decSize: number[];
		incCount: number[];
		incSize: number[];
		totalCount: number[];
		totalSize: number[];
	}; };
	'charts/user/following': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; userId: User['id']; }; res: TODO; };
	'charts/user/notes': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; userId: User['id']; }; res: {
		dec: number[];
		inc: number[];
		total: number[];
		diffs: {
			normal: number[];
			renote: number[];
			reply: number[];
		};
	}; };
	'charts/user/reactions': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; userId: User['id']; }; res: TODO; };
	'charts/users': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		local: {
			dec: number[];
			inc: number[];
			total: number[];
		};
		remote: {
			dec: number[];
			inc: number[];
			total: number[];
		};
	}; };
	'clips/add-note': { req: TODO; res: TODO; };
	'clips/remove-note': { req: TODO; res: TODO; };
	'clips/create': { req: TODO; res: TODO; };
	'clips/delete': { req: { clipId: Clip['id']; }; res: null; };
	'clips/list': { req: TODO; res: TODO; };
	'clips/notes': { req: TODO; res: TODO; };
	'clips/show': { req: TODO; res: TODO; };
	'clips/update': { req: TODO; res: TODO; };
	'drive': { req: NoParams; res: { capacity: number; usage: number; }; };
	'drive/files': { req: { folderId?: DriveFolder['id'] | null; type?: DriveFile['type'] | null; limit?: number; sinceId?: DriveFile['id']; untilId?: DriveFile['id']; }; res: DriveFile[]; };
	'drive/files/attached-notes': { req: TODO; res: TODO; };
	'drive/files/check-existence': { req: TODO; res: TODO; };
	'drive/files/create': { req: TODO; res: TODO; };
	'drive/files/delete': { req: { fileId: DriveFile['id']; }; res: null; };
	'drive/files/find-by-hash': { req: TODO; res: TODO; };
	'drive/files/find': { req: { name: string; folderId?: DriveFolder['id'] | null; }; res: DriveFile[]; };
	'drive/files/show': { req: { fileId?: DriveFile['id']; url?: string; }; res: DriveFile; };
	'drive/files/update': { req: { fileId: DriveFile['id']; folderId?: DriveFolder['id'] | null; name?: string; isSensitive?: boolean; comment?: string | null; }; res: DriveFile; };
	'drive/files/upload-from-url': { req: { url: string; folderId?: DriveFolder['id'] | null; isSensitive?: boolean; comment?: string | null; marker?: string | null; force?: boolean; }; res: null; };
	'drive/folders': { req: { folderId?: DriveFolder['id'] | null; limit?: number; sinceId?: DriveFile['id']; untilId?: DriveFile['id']; }; res: DriveFolder[]; };
	'drive/folders/create': { req: { name?: string; parentId?: DriveFolder['id'] | null; }; res: DriveFolder; };
	'drive/folders/delete': { req: { folderId: DriveFolder['id']; }; res: null; };
	'drive/folders/find': { req: { name: string; parentId?: DriveFolder['id'] | null; }; res: DriveFolder[]; };
	'drive/folders/show': { req: { folderId: DriveFolder['id']; }; res: DriveFolder; };
	'drive/folders/update': { req: { folderId: DriveFolder['id']; name?: string; parentId?: DriveFolder['id'] | null; }; res: DriveFolder; };
	'drive/stream': { req: { type?: DriveFile['type'] | null; limit?: number; sinceId?: DriveFile['id']; untilId?: DriveFile['id']; }; res: DriveFile[]; };
	'email-address/available': { req: TODO; res: TODO; };
	'endpoint': { req: { endpoint: string; }; res: { params: { name: string; type: string; }[]; }; };
	'endpoints': { req: NoParams; res: string[]; };
	'export-custom-emojis': { req: TODO; res: TODO; };
	'federation/followers': { req: { host: string; limit?: number; sinceId?: Following['id']; untilId?: Following['id']; }; res: FollowingFolloweePopulated[]; };
	'federation/following': { req: { host: string; limit?: number; sinceId?: Following['id']; untilId?: Following['id']; }; res: FollowingFolloweePopulated[]; };
	'federation/instances': { req: {
		host?: string | null;
		blocked?: boolean | null;
		notResponding?: boolean | null;
		suspended?: boolean | null;
		federating?: boolean | null;
		subscribing?: boolean | null;
		publishing?: boolean | null;
		limit?: number;
		offset?: number;
		sort?: '+pubSub' | '-pubSub' | '+notes' | '-notes' | '+users' | '-users' | '+following' | '-following' | '+followers' | '-followers' | '+caughtAt' | '-caughtAt' | '+lastCommunicatedAt' | '-lastCommunicatedAt' | '+driveUsage' | '-driveUsage' | '+driveFiles' | '-driveFiles';
	}; res: Instance[]; };
	'federation/show-instance': { req: { host: string; }; res: Instance; };
	'federation/update-remote-user': { req: { userId: User['id']; }; res: null; };
	'federation/users': { req: { host: string; limit?: number; sinceId?: User['id']; untilId?: User['id']; }; res: UserDetailed[]; };
	'federation/stats': { req: TODO; res: TODO; };
	'following/create': { req: { userId: User['id'] }; res: User; };
	'following/delete': { req: { userId: User['id'] }; res: User; };
	'following/invalidate': { req: TODO; res: TODO; };
	'following/requests/accept': { req: { userId: User['id'] }; res: null; };
	'following/requests/cancel': { req: { userId: User['id'] }; res: User; };
	'following/requests/list': { req: NoParams; res: FollowRequest[]; };
	'following/requests/reject': { req: { userId: User['id'] }; res: null; };
	'get-online-users-count': { req: TODO; res: TODO; };
	'hashtags/list': { req: TODO; res: TODO; };
	'hashtags/search': { req: TODO; res: TODO; };
	'hashtags/show': { req: TODO; res: TODO; };
	'hashtags/trend': { req: TODO; res: TODO; };
	'hashtags/users': { req: TODO; res: TODO; };
	'i': { req: NoParams; res: User; };
	'i/2fa/done': { req: TODO; res: TODO; };
	'i/2fa/key-done': { req: TODO; res: TODO; };
	'i/2fa/password-less': { req: TODO; res: TODO; };
	'i/2fa/register-key': { req: TODO; res: TODO; };
	'i/2fa/register': { req: TODO; res: TODO; };
	'i/2fa/remove-key': { req: TODO; res: TODO; };
	'i/2fa/unregister': { req: TODO; res: TODO; };
	'i/apps': { req: TODO; res: TODO; };
	'i/authorized-apps': { req: TODO; res: TODO; };
	'i/change-password': { req: TODO; res: TODO; };
	'i/delete-account': { req: { password: string; }; res: null; };
	'i/export-blocking': { req: TODO; res: TODO; };
	'i/export-following': { req: TODO; res: TODO; };
	'i/export-mute': { req: TODO; res: TODO; };
	'i/export-notes': { req: TODO; res: TODO; };
	'i/export-user-lists': { req: TODO; res: TODO; };
	'i/get-word-muted-notes-count': { req: TODO; res: TODO; };
	'i/import-blocking': { req: TODO; res: TODO; };
	'i/import-following': { req: TODO; res: TODO; };
	'i/import-muting': { req: TODO; res: TODO; };
	'i/import-user-lists': { req: TODO; res: TODO; };
	'i/notifications': { req: {
		limit?: number;
		sinceId?: Notification['id'];
		untilId?: Notification['id'];
		following?: boolean;
		markAsRead?: boolean;
		includeTypes?: Notification['type'][];
		excludeTypes?: Notification['type'][];
	}; res: Notification[]; };
	'i/page-likes': { req: TODO; res: TODO; };
	'i/pages': { req: TODO; res: TODO; };
	'i/pin': { req: { noteId: Note['id']; }; res: MeDetailed; };
	'i/read-all-messaging-messages': { req: TODO; res: TODO; };
	'i/read-all-unread-notes': { req: TODO; res: TODO; };
	'i/read-announcement': { req: TODO; res: TODO; };
	'i/regenerate-token': { req: { password: string; }; res: null; };
	'i/registry/get-all': { req: { scope?: string[]; }; res: Record<string, any>; };
	'i/registry/get-detail': { req: { key: string; scope?: string[]; }; res: { updatedAt: DateString; value: any; }; };
	'i/registry/get': { req: { key: string; scope?: string[]; }; res: any; };
	'i/registry/keys-with-type': { req: { scope?: string[]; }; res: Record<string, 'null' | 'array' | 'number' | 'string' | 'boolean' | 'object'>; };
	'i/registry/keys': { req: { scope?: string[]; }; res: string[]; };
	'i/registry/remove': { req: { key: string; scope?: string[]; }; res: null; };
	'i/registry/scopes': { req: NoParams; res: string[][]; };
	'i/registry/set': { req: { key: string; value: any; scope?: string[]; }; res: null; };
	'i/revoke-token': { req: TODO; res: TODO; };
	'i/signin-history': { req: { limit?: number; sinceId?: Signin['id']; untilId?: Signin['id']; }; res: Signin[]; };
	'i/unpin': { req: { noteId: Note['id']; }; res: MeDetailed; };
	'i/update-email': { req: {
		password: string;
		email?: string | null;
	}; res: MeDetailed; };
	'i/update': { req: {
		name?: string | null;
		description?: string | null;
		lang?: string | null;
		location?: string | null;
		birthday?: string | null;
		avatarId?: DriveFile['id'] | null;
		bannerId?: DriveFile['id'] | null;
		fields?: {
			name: string;
			value: string;
		}[];
		isLocked?: boolean;
		isExplorable?: boolean;
		hideOnlineStatus?: boolean;
		carefulBot?: boolean;
		autoAcceptFollowed?: boolean;
		noCrawle?: boolean;
		isBot?: boolean;
		isCat?: boolean;
		injectFeaturedNote?: boolean;
		receiveAnnouncementEmail?: boolean;
		alwaysMarkNsfw?: boolean;
		mutedWords?: string[][];
		mutingNotificationTypes?: Notification['type'][];
		emailNotificationTypes?: string[];
	}; res: MeDetailed; };
	'i/user-group-invites': { req: TODO; res: TODO; };
	'i/webhooks/create': { req: TODO; res: TODO; };
	'i/webhooks/list': { req: TODO; res: TODO; };
	'i/webhooks/show': { req: TODO; res: TODO; };
	'i/webhooks/update': { req: TODO; res: TODO; };
	'i/webhooks/delete': { req: TODO; res: TODO; };
	'messaging/history': { req: { limit?: number; group?: boolean; }; res: MessagingMessage[]; };
	'messaging/messages': { req: { userId?: User['id']; groupId?: UserGroup['id']; limit?: number; sinceId?: MessagingMessage['id']; untilId?: MessagingMessage['id']; markAsRead?: boolean; }; res: MessagingMessage[]; };
	'messaging/messages/create': { req: { userId?: User['id']; groupId?: UserGroup['id']; text?: string; fileId?: DriveFile['id']; }; res: MessagingMessage; };
	'messaging/messages/delete': { req: { messageId: MessagingMessage['id']; }; res: null; };
	'messaging/messages/read': { req: { messageId: MessagingMessage['id']; }; res: null; };
	'meta': { req: { detail?: boolean; }; res: InstanceMetadata; };
	'miauth/gen-token': { req: TODO; res: TODO; };
	'mute/create': { req: TODO; res: TODO; };
	'mute/delete': { req: { userId: User['id'] }; res: null; };
	'mute/list': { req: TODO; res: TODO; };
	'renote-mute/create': { req: TODO; res: TODO; };
	'renote-mute/delete': { req: { userId: User['id'] }; res: null; };
	'renote-mute/list': { req: TODO; res: TODO; };
	'my/apps': { req: TODO; res: TODO; };
	'notes': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; }; res: Note[]; };
	'notes/children': { req: { noteId: Note['id']; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; }; res: Note[]; };
	'notes/clips': { req: TODO; res: TODO; };
	'notes/conversation': { req: TODO; res: TODO; };
	'notes/create': { req: {
		visibility?: 'public' | 'home' | 'followers' | 'specified',
		visibleUserIds?: User['id'][];
		text?: null | string;
		cw?: null | string;
		viaMobile?: boolean;
		localOnly?: boolean;
		fileIds?: DriveFile['id'][];
		replyId?: null | Note['id'];
		renoteId?: null | Note['id'];
		channelId?: null | Channel['id'];
		poll?: null | {
			choices: string[];
			multiple?: boolean;
			expiresAt?: null | number;
			expiredAfter?: null | number;
		};
	}; res: { createdNote: Note }; };
	'notes/delete': { req: { noteId: Note['id']; }; res: null; };
	'notes/featured': { req: TODO; res: Note[]; };
	'notes/global-timeline': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/hybrid-timeline': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/local-timeline': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/mentions': { req: { following?: boolean; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; }; res: Note[]; };
	'notes/polls/recommendation': { req: TODO; res: TODO; };
	'notes/polls/vote': { req: { noteId: Note['id']; choice: number; }; res: null; };
	'notes/reactions': { req: { noteId: Note['id']; type?: string | null; limit?: number; }; res: NoteReaction[]; };
	'notes/reactions/create': { req: { noteId: Note['id']; reaction: string; }; res: null; };
	'notes/reactions/delete': { req: { noteId: Note['id']; }; res: null; };
	'notes/renotes': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; noteId: Note['id']; }; res: Note[]; };
	'notes/replies': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; noteId: Note['id']; }; res: Note[]; };
	'notes/search-by-tag': { req: TODO; res: TODO; };
	'notes/search': { req: TODO; res: TODO; };
	'notes/show': { req: { noteId: Note['id']; }; res: Note; };
	'notes/state': { req: TODO; res: TODO; };
	'notes/thread-muting/create': { req: TODO; res: TODO; };
	'notes/thread-muting/delete': { req: TODO; res: TODO; };
	'notes/timeline': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/translate': { req: TODO; res: TODO; };
	'notes/unrenote': { req: { noteId: Note['id']; }; res: null; };
	'notes/user-list-timeline': { req: { listId: UserList['id']; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/watching/create': { req: TODO; res: TODO; };
	'notes/watching/delete': { req: { noteId: Note['id']; }; res: null; };
	'notifications/create': { req: { body: string; header?: string | null; icon?: string | null; }; res: null; };
	'notifications/mark-all-as-read': { req: NoParams; res: null; };
	'notifications/read': { req: { notificationId: Notification['id']; }; res: null; };
	'page-push': { req: { pageId: Page['id']; event: string; var?: any; }; res: null; };
	'pages/create': { req: TODO; res: Page; };
	'pages/delete': { req: { pageId: Page['id']; }; res: null; };
	'pages/featured': { req: NoParams; res: Page[]; };
	'pages/like': { req: { pageId: Page['id']; }; res: null; };
	'pages/show': { req: { pageId?: Page['id']; name?: string; username?: string; }; res: Page; };
	'pages/unlike': { req: { pageId: Page['id']; }; res: null; };
	'pages/update': { req: TODO; res: null; };
	'ping': { req: NoParams; res: { pong: number; }; };
	'pinned-users': { req: TODO; res: TODO; };
	'request-reset-password': { req: { username: string; email: string; }; res: null; };
	'reset-db': { req: TODO; res: TODO; };
	'reset-password': { req: { token: string; password: string; }; res: null; };
	'server-info': { req: NoParams; res: ServerInfo; };
	'stats': { req: NoParams; res: Stats; };
	'sw/register': { req: TODO; res: TODO; };
	'sw/unregister': { req: TODO; res: TODO; };
	'username/available': { req: { username: string; }; res: { available: boolean; }; };
	'users': { req: { limit?: number; offset?: number; sort?: UserSorting; origin?: OriginType; }; res: User[]; };
	'users/clips': { req: TODO; res: TODO; };
	'users/followers': { req: { userId?: User['id']; username?: User['username']; host?: User['host'] | null; limit?: number; sinceId?: Following['id']; untilId?: Following['id']; }; res: FollowingFollowerPopulated[]; };
	'users/following': { req: { userId?: User['id']; username?: User['username']; host?: User['host'] | null; limit?: number; sinceId?: Following['id']; untilId?: Following['id']; }; res: FollowingFolloweePopulated[]; };
	'users/groups/create': { req: TODO; res: TODO; };
	'users/groups/delete': { req: { groupId: UserGroup['id'] }; res: null; };
	'users/groups/invitations/accept': { req: TODO; res: TODO; };
	'users/groups/invitations/reject': { req: TODO; res: TODO; };
	'users/groups/invite': { req: TODO; res: TODO; };
	'users/groups/joined': { req: TODO; res: TODO; };
	'users/groups/leave': { req: TODO; res: TODO; };
	'users/groups/owned': { req: TODO; res: TODO; };
	'users/groups/pull': { req: TODO; res: TODO; };
	'users/groups/show': { req: TODO; res: TODO; };
	'users/groups/transfer': { req: TODO; res: TODO; };
	'users/groups/update': { req: TODO; res: TODO; };
	'users/lists/create': { req: { name: string; }; res: UserList; };
	'users/lists/delete': { req: { listId: UserList['id']; }; res: null; };
	'users/lists/list': { req: NoParams; res: UserList[]; };
	'users/lists/pull': { req: { listId: UserList['id']; userId: User['id']; }; res: null; };
	'users/lists/push': { req: { listId: UserList['id']; userId: User['id']; }; res: null; };
	'users/lists/show': { req: { listId: UserList['id']; }; res: UserList; };
	'users/lists/update': { req: { listId: UserList['id']; name: string; }; res: UserList; };
	'users/notes': { req: { userId: User['id']; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'users/pages': { req: TODO; res: TODO; };
	'users/reactions': { req: TODO; res: TODO; };
	'users/recommendation': { req: TODO; res: TODO; };
	'users/relation': { req: TODO; res: TODO; };
	'users/report-abuse': { req: TODO; res: TODO; };
	'users/search-by-username-and-host': { req: TODO; res: TODO; };
	'users/search': { req: TODO; res: TODO; };
	'users/show': { req: ShowUserReq | { userIds: User['id'][]; }; res: {
		$switch: {
			$cases: [[
				{ userIds: User['id'][]; },
				UserDetailed[],
			]];
			$default: UserDetailed;
		};
	}; };
	'users/stats': { req: TODO; res: TODO; };
	'fetch-rss': { req: TODO; res: TODO; };
};
