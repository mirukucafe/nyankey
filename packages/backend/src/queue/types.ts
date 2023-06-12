import httpSignature from '@peertube/http-signature';
import { DriveFile } from '@/models/entities/drive-file.js';
import { Note } from '@/models/entities/note.js';
import { User } from '@/models/entities/user.js';
import { Webhook } from '@/models/entities/webhook.js';
import { IActivity } from '@/remote/activitypub/type.js';

export type DeliverJobData = {
	/** Actor */
	user: ThinUser;
	/** Activity */
	content: unknown;
	/** inbox URL to deliver */
	to: string;
	/** set if this job is part of a user deletion, on completion or failure the isDeleted field needs to be decremented */
	deletingUserId?: string;
};

export type InboxJobData = {
	activity: IActivity;
	signature: httpSignature.IParsedSignature;
};

export type DbJobData = DbUserJobData | DbUserImportJobData | DbUserDeleteJobData;

export type DbUserJobData = {
	user: ThinUser;
	excludeMuting: boolean;
	excludeInactive: boolean;
};

export type DbUserDeleteJobData = {
	user: ThinUser;
	soft?: boolean;
};

export type DbUserImportJobData = {
	user: ThinUser;
	fileId: DriveFile['id'];
};

export type ObjectStorageJobData = ObjectStorageFileJobData | Record<string, unknown>;

export type ObjectStorageFileJobData = {
	key: string;
};

export type EndedPollNotificationJobData = {
	noteId: Note['id'];
};

export type WebhookDeliverJobData = {
	type: string;
	content: unknown;
	webhookId: Webhook['id'];
	userId: User['id'];
	to: string;
	secret: string;
	createdAt: number;
	eventId: string;
};

export type ThinUser = {
	id: User['id'];
};
