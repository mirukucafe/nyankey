process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, startServer, shutdownServer } from './utils.mjs';

describe('Block', function() {
	this.timeout(20*60*1000);

	let p;

	// alice blocks bob
	let alice, bob, carol;

	before(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	});

	after(async () => {
		await shutdownServer(p);
	});

	it('can block someone', async(async () => {
		const res = await request('/blocking/create', {
			userId: bob.id,
		}, alice);

		assert.strictEqual(res.status, 200);
	}));

	it('cannot follow if blocked', async(async () => {
		const res = await request('/following/create', { userId: alice.id }, bob);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.code, 'BLOCKED');
	}));

	it('cannot react to blocking users note', async(async () => {
		const note = await post(alice, { text: 'hello' });

		const res = await request('/notes/reactions/create', { noteId: note.id, reaction: '👍' }, bob);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.code, 'BLOCKED');
	}));

	it('cannot reply to blocking users note', async(async () => {
		const note = await post(alice, { text: 'hello' });

		const res = await request('/notes/create', { replyId: note.id, text: 'yo' }, bob);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.code, 'BLOCKED');
	}));

	it('canot renote blocking users note', async(async () => {
		const note = await post(alice, { text: 'hello' });

		const res = await request('/notes/create', { renoteId: note.id, text: 'yo' }, bob);

		assert.strictEqual(res.status, 400);
		assert.strictEqual(res.body.error.code, 'BLOCKED');
	}));

	it('cannot include blocked users in user lists');

	it('removes users from user lists');

	it('local timeline does not contain blocked users', async(async () => {
		const aliceNote = await post(alice);
		const bobNote = await post(bob);
		const carolNote = await post(carol);

		const res = await request('/notes/local-timeline', {}, bob);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note) => note.id === aliceNote.id), false);
		assert.strictEqual(res.body.some((note) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note) => note.id === carolNote.id), true);
	}));
});
