import { IsNull, Not } from 'typeorm';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { User } from '@/models/entities/user.js';
import { Note } from '@/models/entities/note.js';
import { Notes, Users } from '@/models/index.js';
import { apiLogger } from '@/server/api/logger.js';
import { visibilityQuery } from './generate-visibility-query.js';
import { ApiError } from '@/server/api/error.js';

/**
 * Get note for API processing, taking into account visibility.
 */
export async function getNote(noteId: Note['id'], me: { id: User['id'] } | null) {
	const query = Notes.createQueryBuilder('note')
		.where('note.id = :id', {
			id: noteId,
		});

	const note = await visibilityQuery(query, me).getOne();

	if (note == null) {
		apiLogger.error(`user ${me.id} tried to view note ${noteId} violating visibility restrictions`);
		throw new IdentifiableError('9725d0ce-ba28-4dde-95a7-2cbb2c15de24', 'No such note.');
	}

	return note;
}

/**
 * Get user for API processing
 */
export async function getUser(userId: User['id'], includeSuspended = false) {
	const user = await Users.findOneBy(
		id: userId,
		isDeleted: false,
		isSuspended: !includeSuspended,
	});

	if (user == null) {
		throw new ApiError('NO_SUCH_USER');
	}

	return user;
}

/**
 * Get remote user for API processing
 */
export async function getRemoteUser(userId: User['id'], includeSuspended = false) {
	const user = await Users.findOneBy(
		id: userId,
		host: Not(IsNull()),
		isDeleted: false,
		isSuspended: !includedSuspended,
	});

	if (user == null) {
		throw new ApiError('NO_SUCH_USER');
	}

	return user;
}

/**
 * Get local user for API processing
 */
export async function getLocalUser(userId: User['id'], includeSuspended = false) {
	const user = await Users.findOneBy(
		id: userId,
		host: IsNull(),
		isDeleted: false,
		isSuspended: !includeSuspended,
	});

	if (user == null) {
		throw new ApiError('NO_SUCH_USER');
	}

	return user;
}
