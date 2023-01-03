import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as os from 'node:os';
import cluster from 'node:cluster';
import chalk from 'chalk';
import chalkTemplate from 'chalk-template';
import semver from 'semver';

import Logger from '@/services/logger.js';
import loadConfig from '@/config/load.js';
import { Config } from '@/config/types.js';
import { showMachineInfo } from '@/misc/show-machine-info.js';
import { envOption } from '@/env.js';
import { db, initDb } from '@/db/postgre.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const meta = JSON.parse(fs.readFileSync(`${_dirname}/../../../../built/meta.json`, 'utf-8'));

const logger = new Logger('core', 'cyan');
const bootLogger = logger.createSubLogger('boot', 'magenta', false);

const themeColor = chalk.hex('#86b300');

function greet(): void {
	if (!envOption.quiet) {
		//#region FoundKey logo
		console.log(themeColor('  ___                 _ _  __         '));
		console.log(themeColor(' | __|__ _  _ _ _  __| | |/ /___ _  _ '));
		console.log(themeColor(' | _/ _ \\ || | \' \\/ _` | \' </ -_) || |'));
		console.log(themeColor(' |_|\\___/\\_,_|_||_\\__,_|_|\\_\\___|\\_, |'));
		console.log(themeColor('                                 |__/ '));
		//#endregion

		console.log(' FoundKey is an open-source decentralized microblogging platform.');

		console.log('');
		console.log(chalkTemplate`--- ${os.hostname()} {gray (PID: ${process.pid.toString()})} ---`);
	}

	bootLogger.info('Welcome to FoundKey!');
	bootLogger.info(`FoundKey v${meta.version}`, null, true);
}

/**
 * Init master process
 */
export async function masterMain(): Promise<void> {
	let config!: Config;

	// initialize app
	try {
		greet();
		showEnvironment();
		await showMachineInfo(bootLogger);
		showNodejsVersion();
		config = loadConfigBoot();
		await connectDb();
	} catch (e) {
		bootLogger.error('Fatal error occurred during initialization', {}, true);
		process.exit(1);
	}

	bootLogger.succ('FoundKey initialized');

	if (!envOption.disableClustering) {
		await spawnWorkers(config.clusterLimits);
	}

	bootLogger.succ(`Now listening on port ${config.port} on ${config.url}`, null, true);

	if (!envOption.noDaemons) {
		import('../daemons/server-stats.js').then(x => x.serverStats());
		import('../daemons/queue-stats.js').then(x => x.queueStats());
	}
}

function showEnvironment(): void {
	const env = process.env.NODE_ENV;
	const logger = bootLogger.createSubLogger('env');
	logger.info(typeof env === 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);

	if (env !== 'production') {
		logger.warn('The environment is not in production mode.');
		logger.warn('DO NOT USE FOR PRODUCTION PURPOSE!', {}, true);
	}
}

function showNodejsVersion(): void {
	const nodejsLogger = bootLogger.createSubLogger('nodejs');

	nodejsLogger.info(`Version ${process.version} detected.`);

	const minVersion = fs.readFileSync(`${_dirname}/../../../../.node-version`, 'utf-8').trim();
	if (semver.lt(process.version, minVersion)) {
		nodejsLogger.error(`At least Node.js ${minVersion} required!`);
		process.exit(1);
	}
}

function loadConfigBoot(): Config {
	const configLogger = bootLogger.createSubLogger('config');
	let config;

	try {
		config = loadConfig();
	} catch (exception) {
		const e = exception as Partial<NodeJS.ErrnoException> | Error;
		if ('code' in e && e.code === 'ENOENT') {
			configLogger.error('Configuration file not found', {}, true);
			process.exit(1);
		} else if (e instanceof Error) {
			configLogger.error(e.message);
			process.exit(1);
		}
		throw exception;
	}

	configLogger.succ('Loaded');

	return config;
}

async function connectDb(): Promise<void> {
	const dbLogger = bootLogger.createSubLogger('db');

	// Try to connect to DB
	try {
		dbLogger.info('Connecting...');
		await initDb();
		const v = await db.query('SHOW server_version').then(x => x[0].server_version);
		dbLogger.succ(`Connected: v${v}`);
	} catch (e) {
		dbLogger.error('Cannot connect', {}, true);
		dbLogger.error(e as Error | string);
		process.exit(1);
	}
}

async function spawnWorkers(clusterLimits: Required<Config['clusterLimits']>): Promise<void> {
	const modes = ['web' as const, 'queue' as const];
	const cpus = os.cpus().length;
	for (const mode of modes.filter(mode => clusterLimits[mode] > cpus)) {
		bootLogger.warn(`configuration warning: cluster limit for ${mode} exceeds number of cores (${cpus})`);
	}

	const total = modes.reduce((acc, mode) => acc + clusterLimits[mode], 0);
	const workers = new Array(total);
	workers.fill('web', 0, clusterLimits.web);
	workers.fill('queue', clusterLimits.web);

	bootLogger.info(`Starting ${total} workers...`);
	await Promise.all(workers.map(mode => spawnWorker(mode)));
	bootLogger.succ('All workers started');
}

function spawnWorker(mode: 'web' | 'queue'): Promise<void> {
	return new Promise(res => {
		const worker = cluster.fork({ mode });
		worker.on('message', message => {
			if (message === 'listenFailed') {
				bootLogger.error('The server Listen failed due to the previous error.');
				process.exit(1);
			}
			if (message !== 'ready') return;
			res();
		});
	});
}
