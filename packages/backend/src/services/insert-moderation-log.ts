import { ModerationLogs } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { User } from '@/models/entities/user.js';

export async function insertModerationLog(moderator: { id: User['id'] }, type: string, info?: Record<string, any>): Promise<void> {
	await ModerationLogs.insert({
		id: genId(),
		createdAt: new Date(),
		userId: moderator.id,
		type,
		info: info || {},
	});
}
