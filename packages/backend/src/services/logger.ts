import cluster from 'node:cluster';
import chalk from 'chalk';
import convertColor from 'color-convert';
import { format as dateFormat } from 'date-fns';
import * as SyslogPro from 'syslog-pro';
import config from '@/config/index.js';
import { envOption } from '@/env.js';
import type { KEYWORD } from 'color-convert/conversions.js';

type Domain = {
	name: string;
	color?: KEYWORD;
};

export const LEVELS = {
	error: 0,
	warning: 1,
	success: 2,
	info: 3,
	debug: 4,
};
export type Level = LEVELS[keyof LEVELS];

/**
 * Class that facilitates recording log messages to the console and optionally a syslog server.
 */
export default class Logger {
	private domain: Domain;
	private parentLogger: Logger | null = null;
	private store: boolean;
	private syslogClient: SyslogPro.RFC5424 | null = null;
	/**
	 * Messages below this level will be discarded.
	 */
	private minLevel: Level;

	/**
	 * Create a logger instance.
	 * @param domain Logging domain
	 * @param color Log message color
	 * @param store Whether to store messages
	 */
	constructor(domain: string, color?: KEYWORD, store = true, minLevel: Level = LEVELS.info) {
		this.domain = {
			name: domain,
			color,
		};
		this.store = store;
		this.minLevel = minLevel;

		if (config.syslog) {
			this.syslogClient = new SyslogPro.RFC5424({
				applicationName: 'FoundKey',
				timestamp: true,
				includeStructuredData: true,
				color: true,
				extendedColor: true,
				server: {
					target: config.syslog.host,
					port: config.syslog.port,
				},
			});
		}
	}

	/**
	 * Create a child logger instance.
	 * @param domain Logging domain
	 * @param color Log message color
	 * @param store Whether to store messages
	 * @returns A Logger instance whose parent logger is this instance.
	 */
	public createSubLogger(domain: string, color?: KEYWORD, store = true, minLevel: Level = LEVELS.info): Logger {
		const logger = new Logger(domain, color, store, minLevel);
		logger.parentLogger = this;
		return logger;
	}

	/**
	 * Log a message.
	 * @param level Indicates the level of this particular message. If it is
	 *     less than the minimum level configured, the message will be discarded.
	 * @param message The message to be logged.
	 * @param important Whether to highlight this message as especially important.
	 * @param subDomains Names of sub-loggers to be added.
	 */
	private log(level: Level, message: string, important = false, subDomains: Domain[] = [], _store = true): void {
		if (envOption.quiet) return;
		const store = _store && this.store;

		// Check against the configured log level.
		if (level < this.minLevel) return;

		// If this logger has a parent logger, delegate the actual logging to it,
		// so the parent domain(s) will be logged properly.
		if (this.parentLogger) {
			this.parentLogger.log(level, message, important, [this.domain].concat(subDomains), store);
			return;
		}

		const time = dateFormat(new Date(), 'HH:mm:ss');
		const worker = cluster.isPrimary ? '*' : cluster.worker?.id;
		const domains = [this.domain].concat(subDomains).map(d => d.color ? chalk.rgb(...convertColor.keyword.rgb(d.color))(d.name) : chalk.white(d.name));

		let levelDisplay;
		let messageDisplay;
		switch (level) {
			case LEVELS.error:
				if (important) {
					levelDisplay = chalk.bgRed.white('ERR ');
				} else {
					levelDisplay = chalk.red('ERR ');
				}
				messageDisplay = chalk.red(message);
				break;
			case LEVELS.warning:
				levelDisplay = chalk.yellow('WARN');
				messageDisplay = chalk.yellow(message);
				break;
			case LEVELS.success:
				if (important) {
					levelDisplay = chalk.bgGreen.white('DONE');
				} else {
					levelDisplay = chalk.green('DONE');
				}
				messageDisplay = chalk.green(message);
				break;
			case LEVELS.info:
				levelDisplay = chalk.blue('INFO');
				messageDisplay = message;
				break;
			case LEVELS.debug: default:
				levelDisplay = chalk.gray('VERB');
				messageDisplay = chalk.gray(message);
				break;
		}

		let log = `${levelDisplay} ${worker}\t[${domains.join(' ')}]\t${messageDisplay}`;
		if (envOption.withLogTime) log = chalk.gray(time) + ' ' + log;

		console.log(important ? chalk.bold(log) : log);

		if (store && this.syslogClient) {
			const send =
				level === LEVELS.error ? this.syslogClient.error :
				level === LEVELS.warning ? this.syslogClient.warning :
				this.syslogClient.info;

			send.bind(this.syslogClient)(message).catch(() => {});
		}
	}

	/**
	 * Log an error message.
	 * Use in situations where execution cannot be continued.
	 * @param err Error or string containing an error message
	 * @param important Whether this error is important
	 */
	public error(err: string | Error, important = false): void {
		if (err instanceof Error) {
			this.log(LEVELS.error, err.toString(), important);
		} else if (typeof err === 'object') {
			this.log(LEVELS.error, `${(err as any).message || (err as any).name || err}`, important);
		} else {
			this.log(LEVELS.error, `${err}`, important);
		}
	}

	/**
	 * Log a warning message.
	 * Use in situations where execution can continue but needs to be improved.
	 * @param message Warning message
	 * @param important Whether this warning is important
	 */
	public warn(message: string, important = false): void {
		this.log(LEVELS.warning, message, important);
	}

	/**
	 * Log a success message.
	 * Use in situations where something has been successfully done.
	 * @param message Success message
	 * @param important Whether this success message is important
	 */
	public succ(message: string, important = false): void {
		this.log(LEVELS.success, message, important);
	}

	/**
	 * Log a debug message.
	 * Use for debugging (information needed by developers but not required by users).
	 * @param message Debug message
	 * @param important Whether this debug message is important
	 */
	public debug(message: string, important = false): void {
		this.log(LEVELS.debug, message, important);
	}

	/**
	 * Log an informational message.
	 * Use when something needs to be logged but doesn't fit into other levels.
	 * @param message Info message
	 * @param important Whether this info message is important
	 */
	public info(message: string, important = false): void {
		this.log(LEVELS.info, message, important);
	}
}
