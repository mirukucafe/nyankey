import { RegistrationTickets } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { secureRndstrCustom } from '@/misc/secure-rndstr.js';
import define from '../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			code: {
				type: 'string',
				optional: false, nullable: false,
				example: '2ERUA5VR',
				maxLength: 8,
				minLength: 8,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async () => {
	// omit visually ambiguous zero and letter O as well as one and letter I
	const code = secureRndstrCustom(8, '23456789ABCDEFGHJKLMNPQRSTUVWXYZ');

	await RegistrationTickets.insert({
		id: genId(),
		createdAt: new Date(),
		code,
	});

	return {
		code,
	};
});
