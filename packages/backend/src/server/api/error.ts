import Koa from 'koa';

export class ApiError extends Error {
	public message: string;
	public code: string;
	public httpStatusCode: number;
	public info?: any;

	constructor(
		code: keyof errors = 'INTERNAL_ERROR',
		info?: any | null,
	) {
		let _info = info, _code = code;
		if (!(code in errors)) {
			_code = 'INTERNAL_ERROR';
			_info = `Unknown error "${code}" occurred.`;
		}

		const { message, httpStatusCode } = errors[_code];
		super(message);
		this.code = _code;
		this.info = _info;
		this.message = message;
		this.httpStatusCode = httpStatusCode;
	}

	/**
	 * Makes the response of ctx the current error, given the respective endpoint name.
	 */
	public apply(ctx: Koa.Context, endpoint: string): void {
		ctx.status = this.httpStatusCode;
		// set additional headers
		switch (ctx.status) {
			case 401:
				ctx.response.set('WWW-Authenticate', 'Bearer');
				break;
			case 429:
				if (typeof this.info === 'object' && typeof this.info.reset === 'number') {
					ctx.respose.set('Retry-After', Math.floor(this.info.reset - (Date.now() / 1000)));
				}
				break;
		}
		ctx.body = {
			error: {
				message: this.message,
				code: this.code,
				info: this.info ?? undefined,
				endpoint,
			},
		};
	}
}

export const errors: Record<string, { message: string, httpStatusCode: number }> = {
	ACCESS_DENIED: {
		message: 'Access denied.',
		httpStatusCode: 403,
	},
	ALREADY_ADDED: {
		message: 'That user has already been added to that list or group.',
		httpStatusCode: 409,
	},
	ALREADY_BLOCKING: {
		message: 'You are already blocking that user.',
		httpStatusCode: 409,
	},
	ALREADY_CLIPPED: {
		message: 'That note is already added to that clip.',
		httpStatusCode: 409,
	},
	ALREADY_FAVORITED: {
		message: 'That note is already favorited.',
		httpStatusCode: 409,
	},
	ALREADY_FOLLOWING: {
		message: 'You are already following that user.',
		httpStatusCode: 409,
	},
	ALREADY_INVITED: {
		message: 'That user has already been invited to that group.',
		httpStatusCode: 409,
	},
	ALREADY_LIKED: {
		message: 'You already liked that page.',
		httpStatusCode: 409,
	},
	ALREADY_MUTING: {
		message: 'You are already muting that user.',
		httpStatusCode: 409,
	},
	ALREADY_PINNED: {
		message: 'You already pinned that note.',
		httpStatusCode: 409,
	},
	ALREADY_REACTED: {
		message: 'You already reacted to that note.',
		httpStatusCode: 409,
	},
	ALREADY_VOTED: {
		message: 'You have already voted in that poll.',
		httpStatusCode: 409,
	},
	AUTHENTICATION_FAILED: {
		message: 'Authentication failed.',
		httpStatusCode: 401,
	},
	AUTHENTICATION_REQUIRED: {
		message: 'Authentication is required, but authenticating information was not or not appropriately provided.',
		httpStatusCode: 401,
	},
	BLOCKED: {
		message: 'You are blocked by that user.',
		httpStatusCode: 400,
	},
	BLOCKEE_IS_YOURSELF: {
		message: 'You cannot block yourself.',
		httpStatusCode: 400,
	},
	BLOCKING: {
		message: 'You are blocking that user.',
		httpStatusCode: 400,
	},
	CANNOT_REPORT_ADMIN: {
		message: 'You cannot report an administrator.',
		httpStatusCode: 400,
	},
	CANNOT_REPORT_YOURSELF: {
		message: 'You cannot report yourself.',
		httpStatusCode: 400,
	},
	EMPTY_FILE: {
		message: 'The provided file is empty.',
		httpStatusCode: 400,
	},
	EXPIRED_POLL: {
		message: 'Poll is already expired.',
		httpStatusCode: 400,
	},
	FAILED_TO_RESOLVE_REMOTE_USER: {
		message: 'Failed to resolve remote user.',
		httpStatusCode: 502,
	},
	FILE_TOO_BIG: {
		message: 'The provided file is too big.',
		httpStatusCode: 400,
	},
	FILE_REQUIRED: {
		message: 'This operation requires a file to be provided.',
		httpStatusCode: 400,
	},
	FOLLOWEE_IS_YOURSELF: {
		message: 'You cannot follow yourself.',
		httpStatusCode: 400,
	},
	FOLLOWER_IS_YOURSELF: {
		message: 'You cannot unfollow yourself.',
		httpStatusCode: 400,
	},
	GROUP_OWNER: {
		message: 'The owner of a group may not leave. Instead, ownership can be transferred or the group deleted.',
		httpStatusCode: 400,
	},
	HAS_CHILD_FILES_OR_FOLDERS: {
		message: 'That folder is not empty.',
		httpStatusCode: 400,
	},
	INTERNAL_ERROR: {
		message: 'Internal error occurred. Please contact us if the error persists.',
		httpStatusCode: 500,
	},
	INVALID_CHOICE: {
		message: 'Choice index is invalid.',
		httpStatusCode: 400,
	},
	INVALID_FILE_NAME: {
		message: 'Invalid file name.',
		httpStatusCode: 400,
	},
	INVALID_PARAM: {
		message: 'One or more parameters do not match the API definition.',
		httpStatusCode: 400,
	},
	INVALID_PASSWORD: {
		message: 'The provided password is not suitable.',
		httpStatusCode: 400,
	},
	INVALID_REGEXP: {
		message: 'Invalid Regular Expression',
		httpStatusCode: 400,
	},
	INVALID_URL: {
		message: 'Invalid URL.',
		httpStatusCode: 400,
	},
	INVALID_USERNAME: {
		message: 'Invalid username.',
		httpStatusCode: 400,
	},
	IS_ADMIN: {
		message: 'This action cannot be done to an administrator account.',
		httpStatusCode: 400,
	},
	IS_MODERATOR: {
		message: 'This action cannot be done to a moderator account.',
		httpStatusCode: 400,
	},
	LESS_RESTRICTIVE_VISIBILITY: {
		message: 'The visibility cannot be less restrictive than the parent note.',
		httpStatusCode: 400,
	},
	MUTEE_IS_YOURSELF: {
		message: 'You cannot mute yourself.',
		httpStatusCode: 400,
	},
	NAME_ALREADY_EXISTS: {
		message: 'The specified name already exists.',
		httpStatusCode: 409,
	},
	NO_POLL: {
		message: 'The note does not have an attached poll.',
		httpStatusCode: 404,
	},
	NO_SUCH_ANNOUNCEMENT: {
		message: 'No such announcement.',
		httpStatusCode: 404,
	},
	NO_SUCH_ANTENNA: {
		message: 'No such antenna.',
		httpStatusCode: 404,
	},
	NO_SUCH_APP: {
		message: 'No such app.',
		httpStatusCode: 404,
	},
	NO_SUCH_CLIP: {
		message: 'No such clip.',
		httpStatusCode: 404,
	},
	NO_SUCH_CHANNEL: {
		message: 'No such channel.',
		httpStatusCode: 404,
	},
	NO_SUCH_EMOJI: {
		message: 'No such emoji.',
		httpStatusCode: 404,
	},
	NO_SUCH_ENDPOINT: {
		message: 'No such endpoint.',
		httpStatusCode: 404,
	},
	NO_SUCH_FILE: {
		message: 'No such file.',
		httpStatusCode: 404,
	},
	NO_SUCH_FOLDER: {
		message: 'No such folder.',
		httpStatusCode: 404,
	},
	NO_SUCH_FOLLOW_REQUEST: {
		message: 'No such follow request.',
		httpStatusCode: 404,
	},
	NO_SUCH_GROUP: {
		message: 'No such user group.',
		httpStatusCode: 404,
	},
	NO_SUCH_HASHTAG: {
		message: 'No such hashtag.',
		httpStatusCode: 404,
	},
	NO_SUCH_INVITATION: {
		message: 'No such group invitation.',
		httpStatusCode: 404,
	},
	NO_SUCH_KEY: {
		message: 'No such key.',
		httpStatusCode: 404,
	},
	NO_SUCH_NOTE: {
		message: 'No such note.',
		httpStatusCode: 404,
	},
	NO_SUCH_NOTIFICATION: {
		message: 'No such notification.',
		httpStatusCode: 404,
	},
	NO_SUCH_MESSAGE: {
		message: 'No such message.',
		httpStatusCode: 404,
	},
	NO_SUCH_OBJECT: {
		message: 'No such object.',
		httpStatusCode: 404,
	},
	NO_SUCH_PAGE: {
		message: 'No such page.',
		httpStatusCode: 404,
	},
	NO_SUCH_PARENT_FOLDER: {
		message: 'No such parent folder.',
		httpStatusCode: 404,
	},
	NO_SUCH_RESET_REQUEST: {
		message: 'No such password reset request.',
		httpStatusCode: 404,
	},
	NO_SUCH_SESSION: {
		message: 'No such session',
		httpStatusCode: 404,
	},
	NO_SUCH_USER: {
		message: 'No such user.',
		httpStatusCode: 404,
	},
	NO_SUCH_USER_LIST: {
		message: 'No such user list.',
		httpStatusCode: 404,
	},
	NO_SUCH_WEBHOOK: {
		message: 'No such webhook.',
		httpStatusCode: 404,
	},
	NOT_AN_IMAGE: {
		message: 'The file specified was expected to be an image, but it is not.',
		httpStatusCode: 400,
	},
	NOT_BLOCKING: {
		message: 'You are not blocking that user.',
		httpStatusCode: 409,
	},
	NOT_CLIPPED: {
		message: 'That note is not added to that clip.',
		httpStatusCode: 409,
	},
	NOT_FAVORITED: {
		message: 'You have not favorited that note.',
		httpStatusCode: 409,
	},
	NOT_FOLLOWING: {
		message: 'You are not following that user.',
		httpStatusCode: 409,
	},
	NOT_LIKED: {
		message: 'You have not liked that page.',
		httpStatusCode: 409,
	},
	NOT_MUTING: {
		message: 'You are not muting that user.',
		httpStatusCode: 409,
	},
	NOT_REACTED: {
		message: 'You have not reacted to that note.',
		httpStatusCode: 409,
	},
	PENDING_SESSION: {
		message: 'That authorization process has not been completed yet.',
		httpStatusCode: 400,
	},
	PIN_LIMIT_EXCEEDED: {
		message: 'You can not pin any more notes.',
		httpStatusCode: 400,
	},
	PURE_RENOTE: {
		message: 'You cannot renote or reply to a pure renote.',
		httpStatusCode: 400,
	},
	RATE_LIMIT_EXCEEDED: {
		message: 'Rate limit exceeded. Please try again later.',
		httpStatusCode: 429,
	},
	RECIPIENT_IS_YOURSELF: {
		message: 'You cannot send a message to yourself.',
		httpStatusCode: 400,
	},
	RECURSIVE_FOLDER: {
		message: 'Folder cannot be its own parent.',
		httpStatusCode: 400,
	},
	SUSPENDED: {
		message: 'Your account has been suspended.',
		httpStatusCode: 403,
	},
	TIMELINE_DISABLED: {
		message: 'This timeline is disabled by an administrator.',
		httpStatusCode: 503,
	},
	USED_USERNAME: {
		message: 'That username is not available because it is being used or has been used before. Usernames cannot be reassigned.',
		httpStatusCode: 409,
	},
};
