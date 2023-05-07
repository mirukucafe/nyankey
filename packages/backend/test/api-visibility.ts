process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, startServer, shutdownServer } from './utils.js';

describe('API visibility', () => {
	let p: childProcess.ChildProcess;

	before(async () => {
		p = await startServer();
	});

	after(async () => {
		await shutdownServer(p);
	});

	describe('Note visibility', async () => {
		//#region vars
		/** protagonist */
		let alice: any;
		/** follower */
		let follower: any;
		/** non-follower */
		let other: any;
		/** non-follower who has been replied to or mentioned */
		let target: any;
		/** actor for which a specified visibility was set */
		let target2: any;

		/** public-post */
		let pub: any;
		/** home-post */
		let home: any;
		/** followers-post */
		let fol: any;
		/** specified-post */
		let spe: any;

		/** public-reply to target's post */
		let pubR: any;
		/** home-reply to target's post */
		let homeR: any;
		/** followers-reply to target's post */
		let folR: any;
		/** specified-reply to target's post */
		let speR: any;

		/** public-mention to target */
		let pubM: any;
		/** home-mention to target */
		let homeM: any;
		/** followers-mention to target */
		let folM: any;
		/** specified-mention to target */
		let speM: any;

		/** reply target post */
		let tgt: any;
		//#endregion

		const show = async (noteId: any, by: any) => {
			return await request('/notes/show', {
				noteId,
			}, by);
		};

		before(async () => {
			//#region prepare
			// signup
			alice = await signup({ username: 'alice' });
			follower = await signup({ username: 'follower' });
			other = await signup({ username: 'other' });
			target = await signup({ username: 'target' });
			target2 = await signup({ username: 'target2' });

			// follow alice <= follower
			await request('/following/create', { userId: alice.id }, follower);

			// normal posts
			pub = await post(alice, { text: 'x', visibility: 'public' });
			home = await post(alice, { text: 'x', visibility: 'home' });
			fol = await post(alice, { text: 'x', visibility: 'followers' });
			spe = await post(alice, { text: 'x', visibility: 'specified', visibleUserIds: [target.id] });

			// replies
			tgt = await post(target, { text: 'y', visibility: 'public' });
			pubR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'public' });
			homeR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'home' });
			folR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'followers' });
			speR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'specified' });

			// mentions
			pubM = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'public' });
			homeM = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'home' });
			folM = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'followers' });
			speM = await post(alice, { text: '@target2 x', replyId: tgt.id, visibility: 'specified' });
			//#endregion
		});

		//#region show post
		// public
		it('[show] public post can be seen by author', async(async () => {
			const res = await show(pub.id, alice);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] public post can be seen by follower', async(async () => {
			const res = await show(pub.id, follower);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] public post can be seen by non-follower', async(async () => {
			const res = await show(pub.id, other);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] public post can be seen unauthenticated', async(async () => {
			const res = await show(pub.id, null);
			assert.strictEqual(res.body.text, 'x');
		}));

		// home
		it('[show] home post can be seen by author', async(async () => {
			const res = await show(home.id, alice);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] home post can be seen by follower', async(async () => {
			const res = await show(home.id, follower);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] home post can be seen by non-follower', async(async () => {
			const res = await show(home.id, other);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] home post can be seen unauthenticated', async(async () => {
			const res = await show(home.id, null);
			assert.strictEqual(res.body.text, 'x');
		}));

		// followers
		it('[show] followers post can be seen by author', async(async () => {
			const res = await show(fol.id, alice);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] followers post can be seen by follower', async(async () => {
			const res = await show(fol.id, follower);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] followers post is hidden from non-follower', async(async () => {
			const res = await show(fol.id, other);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] followers post is hidden when unathenticated', async(async () => {
			const res = await show(fol.id, null);
			assert.strictEqual(res.status, 404);
		}));

		// specified
		it('[show] specified post can be seen by author', async(async () => {
			const res = await show(spe.id, alice);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] specified post can be seen by designated user', async(async () => {
			const res = await show(spe.id, target);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] specified post is hidden from non-specified follower', async(async () => {
			const res = await show(spe.id, follower);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] specified post is hidden from non-follower', async(async () => {
			const res = await show(spe.id, other);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] specified post is hidden when unauthenticated', async(async () => {
			const res = await show(spe.id, null);
			assert.strictEqual(res.status, 404);
		}));
		//#endregion

		//#region show reply
		// public
		it('[show] public reply can be seen by author', async(async () => {
			const res = await show(pubR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] public reply can be seen by replied to author', async(async () => {
			const res = await show(pubR.id, target);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] public reply can be seen by follower', async(async () => {
			const res = await show(pubR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] public reply can be seen by non-follower', async(async () => {
			const res = await show(pubR.id, other);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] public reply can be seen unauthenticated', async(async () => {
			const res = await show(pubR.id, null);
			assert.strictEqual(res.body.text, 'x');
		}));

		// home
		it('[show] home reply can be seen by author', async(async () => {
			const res = await show(homeR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] home reply can be seen by replied to author', async(async () => {
			const res = await show(homeR.id, target);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] home reply can be seen by follower', async(async () => {
			const res = await show(homeR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] home reply can be seen by non-follower', async(async () => {
			const res = await show(homeR.id, other);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] home reply can be seen unauthenticated', async(async () => {
			const res = await show(homeR.id, null);
			assert.strictEqual(res.body.text, 'x');
		}));

		// followers
		it('[show] followers reply can be seen by author', async(async () => {
			const res = await show(folR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] followers reply can be seen by replied to author', async(async () => {
			const res = await show(folR.id, target);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] followers reply can be seen by follower', async(async () => {
			const res = await show(folR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] followers reply is hidden from non-follower', async(async () => {
			const res = await show(folR.id, other);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] followers reply is hidden when unauthenticated', async(async () => {
			const res = await show(folR.id, null);
			assert.strictEqual(res.status, 404);
		}));

		// specified
		it('[show] specified reply can be seen by author', async(async () => {
			const res = await show(speR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] specified reply can be seen by replied to user', async(async () => {
			const res = await show(speR.id, target);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] specified-replyをされた人が指定されてなくても見れる', async(async () => {
			const res = await show(speR.id, target);
			assert.strictEqual(res.body.text, 'x');
		}));

		it('[show] specified reply is hidden from follower', async(async () => {
			const res = await show(speR.id, follower);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] specified reply is hidden from non-follower', async(async () => {
			const res = await show(speR.id, other);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] specified reply is hidden when unauthenticated', async(async () => {
			const res = await show(speR.id, null);
			assert.strictEqual(res.status, 404);
		}));
		//#endregion

		//#region show mention
		// public
		it('[show] public-mention can be seen by author', async(async () => {
			const res = await show(pubM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] public mention can be seen by mentioned', async(async () => {
			const res = await show(pubM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] public mention can be seen by follower', async(async () => {
			const res = await show(pubM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] public mention can be seen by non-follower', async(async () => {
			const res = await show(pubM.id, other);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] public mention can be seen unauthenticated', async(async () => {
			const res = await show(pubM.id, null);
			assert.strictEqual(res.body.text, '@target x');
		}));

		// home
		it('[show] home mention can be seen by author', async(async () => {
			const res = await show(homeM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] home mention can be seen by mentioned', async(async () => {
			const res = await show(homeM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] home mention can be seen by follower', async(async () => {
			const res = await show(homeM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] home mention can be seen by non-follower', async(async () => {
			const res = await show(homeM.id, other);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] home mention can be seen unauthenticated', async(async () => {
			const res = await show(homeM.id, null);
			assert.strictEqual(res.body.text, '@target x');
		}));

		// followers
		it('[show] followers mention can be seen by author', async(async () => {
			const res = await show(folM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] followers mention can be seen by non-follower mentioned', async(async () => {
			const res = await show(folM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] followers mention can be seen by follower', async(async () => {
			const res = await show(folM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		}));

		it('[show] followers mention is hidden from non-follower', async(async () => {
			const res = await show(folM.id, other);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] followers mention is hidden when unauthenticated', async(async () => {
			const res = await show(folM.id, null);
			assert.strictEqual(res.status, 404);
		}));

		// specified
		it('[show] specified mention can be seen by author', async(async () => {
			const res = await show(speM.id, alice);
			assert.strictEqual(res.body.text, '@target2 x');
		}));

		it('[show] specified mention can be seen by specified actor', async(async () => {
			const res = await show(speM.id, target);
			assert.strictEqual(res.body.text, '@target2 x');
		}));

		it('[show] specified mention is hidden from mentioned but not specified actor', async(async () => {
			const res = await show(speM.id, target2);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] specified mention is hidden from follower', async(async () => {
			const res = await show(speM.id, follower);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] specified mention is hidden from non-follower', async(async () => {
			const res = await show(speM.id, other);
			assert.strictEqual(res.status, 404);
		}));

		it('[show] specified mention is hidden when unauthenticated', async(async () => {
			const res = await show(speM.id, null);
			assert.strictEqual(res.status, 404);
		}));
		//#endregion

		//#region Home Timeline
		it('[TL] public post on author home TL', async(async () => {
			const res = await request('/notes/timeline', { limit: 100 }, alice);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id == pub.id);
			assert.strictEqual(notes[0].text, 'x');
		}));

		it('[TL] public post absent from non-follower home TL', async(async () => {
			const res = await request('/notes/timeline', { limit: 100 }, other);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id == pub.id);
			assert.strictEqual(notes.length, 0);
		}));

		it('[TL] followers post on follower home TL', async(async () => {
			const res = await request('/notes/timeline', { limit: 100 }, follower);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id == fol.id);
			assert.strictEqual(notes[0].text, 'x');
		}));
		//#endregion

		//#region replies timeline
		it('[TL] followers reply on follower reply TL', async(async () => {
			const res = await request('/notes/replies', { noteId: tgt.id, limit: 100 }, follower);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id == folR.id);
			assert.strictEqual(notes[0].text, 'x');
		}));

		it('[TL] followers reply absent from not replied to non-follower reply TL', async(async () => {
			const res = await request('/notes/replies', { noteId: tgt.id, limit: 100 }, other);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id == folR.id);
			assert.strictEqual(notes.length, 0);
		}));

		it('[TL] followers reply on replied to actor reply TL', async(async () => {
			const res = await request('/notes/replies', { noteId: tgt.id, limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id == folR.id);
			assert.strictEqual(notes[0].text, 'x');
		}));
		//#endregion

		//#region MTL
		it('[TL] followers reply on replied to non-follower mention TL', async(async () => {
			const res = await request('/notes/mentions', { limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id == folR.id);
			assert.strictEqual(notes[0].text, 'x');
		}));

		it('[TL] followers mention on mentioned non-follower mention TL', async(async () => {
			const res = await request('/notes/mentions', { limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id == folM.id);
			assert.strictEqual(notes[0].text, '@target x');
		}));
		//#endregion
	});
});
