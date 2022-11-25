import os from 'node:os';
import cluster from 'node:cluster';
import { initDb } from '@/db/postgre.js';

/**
 * Init worker process
 */
export async function workerMain(): Promise<void> {
	await initDb();

	if (!process.env.mode || process.env.mode === 'web') {
		// start server
		await import('../server/index.js').then(x => x.default());
	}

	if (!process.env.mode || process.env.mode === 'queue') {
		// start job queue
		import('../queue/index.js').then(x => x.default());

		if (process.env.mode === 'queue') {
			// if this is an exclusive queue worker, renice to have higher priority
			os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
		}
	}

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send?.('ready');
	}
}
