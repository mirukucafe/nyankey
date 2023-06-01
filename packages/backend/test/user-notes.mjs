process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, uploadUrl, startServer, shutdownServer } from './utils.mjs';

describe('users/notes', function() {
	this.timeout(20*60*1000);

	let p;

	let alice, jpgNote, pngNote, jpgPngNote;

	before(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		const jpg = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');
		const png = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.png');
		jpgNote = await post(alice, {
			fileIds: [jpg.id],
		});
		pngNote = await post(alice, {
			fileIds: [png.id],
		});
		jpgPngNote = await post(alice, {
			fileIds: [jpg.id, png.id],
		});
	});

	after(async() => {
		await shutdownServer(p);
	});

	it('ファイルタイプ指定 (jpg)', async(async () => {
		const res = await request('/users/notes', {
			userId: alice.id,
			fileType: ['image/jpeg'],
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.length, 2);
		assert.strictEqual(res.body.some((note) => note.id === jpgNote.id), true);
		assert.strictEqual(res.body.some((note) => note.id === jpgPngNote.id), true);
	}));

	it('ファイルタイプ指定 (jpg or png)', async(async () => {
		const res = await request('/users/notes', {
			userId: alice.id,
			fileType: ['image/jpeg', 'image/png'],
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.length, 3);
		assert.strictEqual(res.body.some((note) => note.id === jpgNote.id), true);
		assert.strictEqual(res.body.some((note) => note.id === pngNote.id), true);
		assert.strictEqual(res.body.some((note) => note.id === jpgPngNote.id), true);
	}));
});
