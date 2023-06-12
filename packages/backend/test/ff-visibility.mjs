process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, react, connectStream, startServer, shutdownServer, simpleGet } from './utils.mjs';

describe('FF visibility', function() {
	this.timeout(20*60*1000);

	let p;

	let alice, bob, follower;

	before(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		follower = await signup({ username: 'follower' });

		await request('/following/create', { userId: alice.id }, follower);
	});

	after(async () => {
		await shutdownServer(p);
	});

	const visible = (user) => {
		return async () => {
			const followingRes = await request('/users/following', {
				userId: alice.id,
			}, user);
			const followersRes = await request('/users/followers', {
				userId: alice.id,
			}, user);

			assert.strictEqual(followingRes.status, 200);
			assert.ok(Array.isArray(followingRes.body));
			assert.strictEqual(followersRes.status, 200);
			assert.ok(Array.isArray(followersRes.body));
		};
	};

	const hidden = (user) => {
		return async () => {
			const followingRes = await request('/users/following', {
				userId: alice.id,
			}, user);
			const followersRes = await request('/users/followers', {
				userId: alice.id,
			}, user);

			assert.strictEqual(followingRes.status, 403);
			assert.strictEqual(followersRes.status, 403);
		};
	};

	describe('public visibility', () => {
		before(async () => {
			await request('/i/update', {
				ffVisibility: 'public',
			}, alice);
		});

		it('shows followers and following to self', visible(alice));
		it('shows followers and following to a follower', visible(follower));
		it('shows followers and following to a non-follower', visible(bob));
		it('shows followers and following when unauthenticated', visible(null));

		it('provides followers in ActivityPub representation', async () => {
			const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
			const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(followersRes.status, 200);
		});
	});

	describe('followers visibility', () => {
		before(async () => {
			await request('/i/update', {
				ffVisibility: 'followers',
			}, alice);
		});

		it('shows followers and following to self', visible(alice));
		it('shows followers and following to a follower', visible(follower));
		it('hides followers and following from a non-follower', hidden(bob));
		it('hides followers and following when unauthenticated', hidden(null));

		it('hides followers from ActivityPub representation', async () => {
			const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json').catch(res => ({ status: res.statusCode }));
			const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json').catch(res => ({ status: res.statusCode }));
			assert.strictEqual(followingRes.status, 403);
			assert.strictEqual(followersRes.status, 403);
		});
	});

	describe('private visibility', () => {
		before(async () => {
			await request('/i/update', {
				ffVisibility: 'private',
			}, alice);
		});

		it('shows followers and following to self', visible(alice));
		it('hides followers and following from a follower', hidden(follower));
		it('hides followers and following from a non-follower', hidden(bob));
		it('hides followers and following when unauthenticated', hidden(null));

		it('hides followers from ActivityPub representation', async () => {
			const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json').catch(res => ({ status: res.statusCode }));
			const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json').catch(res => ({ status: res.statusCode }));
			assert.strictEqual(followingRes.status, 403);
			assert.strictEqual(followersRes.status, 403);
		});
	});
});
