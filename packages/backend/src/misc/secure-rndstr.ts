import * as crypto from 'node:crypto';

const L_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const LU_CHARS = L_CHARS + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function secureRndstrCustom(length = 32, chars: string): string {
	const chars_len = chars.length;

	let str = '';

	for (let i = 0; i < length; i++) {
		let rand = Math.floor((crypto.randomBytes(1).readUInt8(0) / 0xFF) * chars_len);
		if (rand === chars_len) {
			rand = chars_len - 1;
		}
		str += chars.charAt(rand);
	}

	return str;
}

export function secureRndstr(length = 32, useLU = true): string {
	const chars = useLU ? LU_CHARS : L_CHARS;
	return secureRndstrCustom(length, chars);
}
