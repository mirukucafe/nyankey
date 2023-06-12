export type obj = { [x: string]: any };
export type ApObject = IObject | string | (IObject | string)[];

export interface IObject {
	'@context': string | string[] | obj | obj[];
	type: string | string[];
	id?: string;
	summary?: string;
	published?: string;
	cc?: ApObject;
	to?: ApObject;
	attributedTo: ApObject;
	attachment?: any[];
	inReplyTo?: any;
	replies?: ICollection;
	content?: string;
	name?: string;
	startTime?: Date;
	endTime?: Date;
	icon?: any;
	image?: any;
	url?: ApObject;
	href?: string;
	tag?: IObject | IObject[];
	sensitive?: boolean;
}

/**
 * Get array of ActivityStreams Objects id
 */
export function getApIds(value: ApObject | undefined): string[] {
	if (value == null) return [];
	const array = Array.isArray(value) ? value : [value];
	return array.map(x => getApId(x));
}

/**
 * Get ActivityStreams Object id
 */
export function getApId(value: string | Object): string {
	let url = null;
	if (typeof value === 'string') url = value;
	else if (typeof value.id === 'string') url = value.id;

	if (!url || !['https:', 'http:'].includes(new URL(url).protocol)) {
		throw new Error('cannot determine id');
	} else {
		return url;
	}
}

/**
 * Get first (valid) ActivityStreams Object id
 */
export function getOneApId(value: ApObject): string {
	if (Array.isArray(value)) {
		// find the first valid ID
		for (const x of value) {
			try {
				return getApId(x);
			} catch {
				continue;
			}
		}
		throw new Error('cannot determine id');
	} else {
		return getApId(value);
	}
}

/**
 * Get ActivityStreams Object type
 */
export function getApType(value: Object): string {
	if (typeof value.type === 'string') return value.type;
	if (Array.isArray(value.type) && typeof value.type[0] === 'string') return value.type[0];
	throw new Error('cannot detect type');
}

export function getApHrefNullable(value: string | IObject | undefined): string | undefined {
	let url = null;
	if (typeof value === 'string') url = value;
	else if (typeof value?.href === 'string') url = value.href;

	if (!url || !['https:', 'http:'].includes(new URL(url).protocol)) {
		return undefined;
	} else {
		return url;
	}
}

export function getOneApHrefNullable(value: ApObject | undefined): string | undefined {
	if (!value) {
		return;
	} else if (Array.isArray(value)) {
		// find the first valid href
		for (const href of value) {
			try {
				return getApHrefNullable(href);
			} catch {
				continue;
			}
		}
		return undefined;
	} else {
		return getApHrefNullable(value);
	}
}

export interface IActivity extends IObject {
	//type: 'Activity';
	actor: IObject | string;
	object: IObject | string;
	target?: IObject | string;
	/** LD-Signature */
	signature?: {
		type: string;
		created: Date;
		creator: string;
		domain?: string;
		nonce?: string;
		signatureValue: string;
	};
}

export interface ICollection extends IObject {
	type: 'Collection';
	totalItems: number;
	items: ApObject;
}

export interface IOrderedCollection extends IObject {
	type: 'OrderedCollection';
	totalItems: number;
	orderedItems: ApObject;
}

export const validPost = ['Note', 'Question', 'Article', 'Audio', 'Document', 'Image', 'Page', 'Video', 'Event'];

export const isPost = (object: IObject): object is IPost =>
	validPost.includes(getApType(object));

export interface IPost extends IObject {
	type: 'Note' | 'Question' | 'Article' | 'Audio' | 'Document' | 'Image' | 'Page' | 'Video' | 'Event';
	source?: {
		content: string;
		mediaType: string;
	};
	_misskey_quote?: string;
	quoteUri?: string;
	_misskey_talk: boolean;
}

export interface IQuestion extends IObject {
	type: 'Note' | 'Question';
	source?: {
		content: string;
		mediaType: string;
	};
	_misskey_quote?: string;
	quoteUri?: string;
	oneOf?: IQuestionChoice[];
	anyOf?: IQuestionChoice[];
	endTime?: Date;
	closed?: Date;
}

export const isQuestion = (object: IObject): object is IQuestion =>
	getApType(object) === 'Note' || getApType(object) === 'Question';

interface IQuestionChoice {
	name?: string;
	replies?: ICollection;
}
export interface ITombstone extends IObject {
	type: 'Tombstone';
	formerType?: string;
	deleted?: Date;
}

export const isTombstone = (object: IObject): object is ITombstone =>
	getApType(object) === 'Tombstone';

export const validActor = ['Person', 'Service', 'Group', 'Organization', 'Application'];

export const isActor = (object: IObject): object is IActor =>
	validActor.includes(getApType(object));

export interface IActor extends IObject {
	type: 'Person' | 'Service' | 'Organization' | 'Group' | 'Application';
	name?: string;
	preferredUsername?: string;
	manuallyApprovesFollowers?: boolean;
	discoverable?: boolean;
	inbox: string;
	sharedInbox?: string;	// 後方互換性のため
	publicKey?: {
		id: string;
		publicKeyPem: string;
	};
	followers?: string | ICollection | IOrderedCollection;
	following?: string | ICollection | IOrderedCollection;
	featured?: string | IOrderedCollection;
	outbox: string | IOrderedCollection;
	endpoints?: {
		sharedInbox?: string;
	};
	'vcard:bday'?: string;
	'vcard:Address'?: string;
}

export const isCollection = (object: IObject): object is ICollection =>
	getApType(object) === 'Collection';

export const isOrderedCollection = (object: IObject): object is IOrderedCollection =>
	getApType(object) === 'OrderedCollection';

export const isCollectionOrOrderedCollection = (object: IObject): object is ICollection | IOrderedCollection =>
	isCollection(object) || isOrderedCollection(object);

export interface IApPropertyValue extends IObject {
	type: 'PropertyValue';
	identifier: IApPropertyValue;
	name: string;
	value: string;
}

export const isPropertyValue = (object: IObject): object is IApPropertyValue =>
	object &&
	getApType(object) === 'PropertyValue' &&
	typeof object.name === 'string' &&
	typeof (object as any).value === 'string';

export interface IApEmoji extends IObject {
	type: 'Emoji';
	updated: Date;
}

export const isEmoji = (object: IObject): object is IApEmoji =>
	getApType(object) === 'Emoji' && !Array.isArray(object.icon) && object.icon.url != null;

export interface ICreate extends IActivity {
	type: 'Create';
}

export interface IDelete extends IActivity {
	type: 'Delete';
}

export interface IUpdate extends IActivity {
	type: 'Update';
}

export interface IRead extends IActivity {
	type: 'Read';
}

export interface IUndo extends IActivity {
	type: 'Undo';
}

export interface IFollow extends IActivity {
	type: 'Follow';
}

export interface IAccept extends IActivity {
	type: 'Accept';
}

export interface IReject extends IActivity {
	type: 'Reject';
}

export interface IAdd extends IActivity {
	type: 'Add';
}

export interface IRemove extends IActivity {
	type: 'Remove';
}

export interface ILike extends IActivity {
	type: 'Like' | 'EmojiReaction' | 'EmojiReact';
	content?: string;
}

export interface IAnnounce extends IActivity {
	type: 'Announce';
}

export interface IBlock extends IActivity {
	type: 'Block';
}

export interface IFlag extends IActivity {
	type: 'Flag';
}

export interface IMove extends IActivity {
	type: 'Move';
}

export const isCreate = (object: IObject): object is ICreate => getApType(object) === 'Create';
export const isDelete = (object: IObject): object is IDelete => getApType(object) === 'Delete';
export const isUpdate = (object: IObject): object is IUpdate => getApType(object) === 'Update';
export const isRead = (object: IObject): object is IRead => getApType(object) === 'Read';
export const isUndo = (object: IObject): object is IUndo => getApType(object) === 'Undo';
export const isFollow = (object: IObject): object is IFollow => getApType(object) === 'Follow';
export const isAccept = (object: IObject): object is IAccept => getApType(object) === 'Accept';
export const isReject = (object: IObject): object is IReject => getApType(object) === 'Reject';
export const isAdd = (object: IObject): object is IAdd => getApType(object) === 'Add';
export const isRemove = (object: IObject): object is IRemove => getApType(object) === 'Remove';
export const isLike = (object: IObject): object is ILike => getApType(object) === 'Like' || getApType(object) === 'EmojiReaction' || getApType(object) === 'EmojiReact';
export const isAnnounce = (object: IObject): object is IAnnounce => getApType(object) === 'Announce';
export const isBlock = (object: IObject): object is IBlock => getApType(object) === 'Block';
export const isFlag = (object: IObject): object is IFlag => getApType(object) === 'Flag';
export const isMove = (object: IObject): object is IMove => getApType(object) === 'Move';

export interface ILink {
	href: string;
	rel?: string | string[];
	mediaType?: string;
	name?: string;
}

export interface IApMention extends ILink {
	type: 'Mention';
}

export interface IApHashtag extends ILink {
	type: 'Hashtag';
	name: string;
}

export const isLink = (object: Record<string, any>): object is ILink =>
	typeof object.href === 'string'
	&& (
		object.rel == undefined
		|| typeof object.rel === 'string'
		|| (Array.isArray(object.rel) && object.rel.every(x => typeof x === 'string'))
	)
	&& (object.mediaType == undefined || typeof object.mediaType === 'string');
export const isMention = (object: Record<string, any>): object is IApMention =>
	getApType(object) === 'Mention' && isLink(object);
export const isHashtag = (object: Record<string, any>): object is IApHashtag =>
	getApType(object) === 'Hashtag'
	&& isLink(object)
	&& typeof object.name === 'string';
