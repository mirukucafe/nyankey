import config from '@/config/index.js';
import { ILocalUser } from '@/models/entities/user.js';

// to anonymise reporters, the reporting actor must be a system user
// object has to be a uri or array of uris
export const renderFlag = (user: ILocalUser, object: [string], content: string) => {
	return {
		type: 'Flag',
		actor: `${config.url}/users/${user.id}`,
		content,
		object,
	};
};
