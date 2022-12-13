import * as fs from 'node:fs';
import Ajv from 'ajv';
import { CacheableLocalUser } from '@/models/entities/user.js';
import { Schema, SchemaType } from '@/misc/schema.js';
import { AccessToken } from '@/models/entities/access-token.js';
import { IEndpointMeta } from './endpoints.js';
import { ApiError } from './error.js';

export type Response = Record<string, any> | void;

// TODO: paramsの型をT['params']のスキーマ定義から推論する
type executor<T extends IEndpointMeta, Ps extends Schema> =
	(params: SchemaType<Ps>, user: T['requireCredential'] extends true ? CacheableLocalUser : CacheableLocalUser | null, token: AccessToken | null, file?: any, cleanup?: () => any) =>
		Promise<T['res'] extends undefined ? Response : SchemaType<NonNullable<T['res']>>>;

const ajv = new Ajv({
	useDefaults: true,
});

ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);

export default function <T extends IEndpointMeta, Ps extends Schema>(meta: T, paramDef: Ps, cb: executor<T, Ps>)
		: (params: any, user: T['requireCredential'] extends true ? CacheableLocalUser : CacheableLocalUser | null, token: AccessToken | null, file?: any) => Promise<any> {
	const validate = ajv.compile(paramDef);

	return (params: any, user: T['requireCredential'] extends true ? CacheableLocalUser : CacheableLocalUser | null, token: AccessToken | null, file?: any) => {
		function cleanup() {
			fs.unlink(file.path, () => {});
		}

		if (meta.requireFile && file == null) {
			return Promise.reject(new ApiError('FILE_REQUIRED'));
		}

		const valid = validate(params);
		if (!valid) {
			if (file) cleanup();

			const errors = validate.errors!;
			const err = new ApiError('INVALID_PARAM', {
				param: errors[0].schemaPath,
				reason: errors[0].message,
			});
			return Promise.reject(err);
		}

		return cb(params as SchemaType<Ps>, user, token, file, cleanup);
	};
}
