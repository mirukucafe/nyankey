import cluster from 'node:cluster';
import chalk from 'chalk';
import Xev from 'xev';

import Logger from '@/services/logger.js';
import { envOption, LOG_LEVELS } from '@/env.js';

// for typeorm
import 'reflect-metadata';
import { masterMain } from './master.js';
import { workerMain } from './worker.js';

const logger = new Logger('core', 'cyan');
const clusterLogger = logger.createSubLogger('cluster', 'orange', false);
const ev = new Xev();

/**
 * Init process
 */
export async function boot(): Promise<void> {
	if (envOption.disableClustering) {
		process.title = "Foundkey";
	} else if (cluster.isPrimary) {
		process.title = "Foundkey (master)";
	} else if (cluster.isWorker) {
		process.title = `Foundkey (${process.env.mode})`;
	}

	if (cluster.isPrimary || envOption.disableClustering) {
		await masterMain();

		if (cluster.isPrimary) {
			ev.mount();
		}
	}

	if (cluster.isWorker || envOption.disableClustering) {
		await workerMain();
	}

	// for when FoundKey is launched as a child process during unit testing
	// otherwise, process.send cannot be used, so it is suppressed
	if (process.send) {
		process.send('ok');
	}
}

//#region Events

// Listen new workers
cluster.on('fork', worker => {
	clusterLogger.debug(`Process forked: [${worker.id}]`);
});

// Listen online workers
cluster.on('online', worker => {
	clusterLogger.debug(`Process is now online: [${worker.id}]`);
});

// Listen for dying workers
cluster.on('exit', worker => {
	// Replace the dead worker,
	// we're not sentimental
	clusterLogger.error(chalk.red(`[${worker.id}] died :(`));
	cluster.fork();
});

// Display detail of unhandled promise rejection
if (envOption.logLevel !== LOG_LEVELS.quiet) {
	process.on('unhandledRejection', console.dir);
}

// Display detail of uncaught exception
process.on('uncaughtException', err => {
	try {
		logger.error(err);
	} catch {
		// if that fails too there is nothing we can do
	}
});

// Dying away...
process.on('exit', code => {
	logger.info(`The process is going to exit with code ${code}`);
});

//#endregion
