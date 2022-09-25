import * as crypto from 'node:crypto';

// AID generation
// 8 chars: milliseconds elapsed since 2000-01-01 00:00:00.000Z encoded as base36
// + 2 random chars

const TIME2000 = 946684800000;
let counter = crypto.randomBytes(2).readUInt16LE(0);

export function genId(date: Date = new Date()): string {
	let t = Math.min(date.valueOf(), new Date().valueOf());
	t -= TIME2000;
	if (t < 0) t = 0;
	if (isNaN(t)) throw new Error('Failed to create AID: Invalid Date');
	const time = t.toString(36).padStart(8, '0');

	counter++;
	const noise = counter.toString(36).padStart(2, '0').slice(-2);

	return time + noise;
}
