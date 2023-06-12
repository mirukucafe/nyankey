process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import * as sinon from 'sinon';
import { async, signup, startServer, shutdownServer, initTestDb } from '../utils.mjs';

describe('Creating a block activity', function() {
	this.timeout(20*60*1000);

	let p;

	// alice blocks bob
	let alice, bob, carol;

	before(async () => {
		await initTestDb();
		p = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
		bob.host = 'http://remote';
		carol.host = 'http://remote';
	});

	beforeEach(() => {
		sinon.restore();
	});

	after(async () => {
		await shutdownServer(p);
	});

	it('Should federate blocks normally', async(async () => {
		const createBlock = (await import('../../built/services/blocking/create')).default;
		const deleteBlock = (await import('../../built/services/blocking/delete')).default;

		const queues = await import('../../built/queue/index');
		const spy = sinon.spy(queues, 'deliver');
		await createBlock(alice, bob);
		assert(spy.calledOnce);
		await deleteBlock(alice, bob);
		assert(spy.calledTwice);
	}));

	it('Should not federate blocks if federateBlocks is false', async () => {
		const createBlock = (await import('../../built/services/blocking/create')).default;
		const deleteBlock = (await import('../../built/services/blocking/delete')).default;

		alice.federateBlocks = true;

		const queues = await import('../../built/queue/index');
		const spy = sinon.spy(queues, 'deliver');
		await createBlock(alice, carol);
		await deleteBlock(alice, carol);
		assert(spy.notCalled);
	});
});
