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

type Level = 'error' | 'success' | 'warning' | 'debug' | 'info';

/**
 * Class that facilitates recording log messages to the console and optionally a syslog server.
 */
export default class Logger {
	private domain: Domain;
	private parentLogger: Logger | null = null;
	private store: boolean;
	private syslogClient: SyslogPro.RFC5424 | null = null;

	/**
	 * Create a logger instance.
	 * @param domain Logging domain
	 * @param color Log message color
	 * @param store Whether to store messages
	 */
	constructor(domain: string, color?: KEYWORD, store = true) {
		this.domain = {
			name: domain,
			color,
		};
		this.store = store;

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
	public createSubLogger(domain: string, color?: KEYWORD, store = true): Logger {
		const logger = new Logger(domain, color, store);
		logger.parentLogger = this;
		return logger;
	}

	private log(level: Level, message: string, data?: Record<string, any> | null, important = false, subDomains: Domain[] = [], _store = true): void {
		if (envOption.quiet) return;
		const store = _store && this.store && (level !== 'debug');

		if (this.parentLogger) {
			this.parentLogger.log(level, message, data, important, [this.domain].concat(subDomains), store);
			return;
		}

		const time = dateFormat(new Date(), 'HH:mm:ss');
		const worker = cluster.isPrimary ? '*' : cluster.worker?.id;
		const l =
			level === 'error' ? important ? chalk.bgRed.white('ERR ') : chalk.red('ERR ') :
			level === 'warning' ? chalk.yellow('WARN') :
			level === 'success' ? important ? chalk.bgGreen.white('DONE') : chalk.green('DONE') :
			level === 'debug' ? chalk.gray('VERB') :
			chalk.blue('INFO');
		const domains = [this.domain].concat(subDomains).map(d => d.color ? chalk.rgb(...convertColor.keyword.rgb(d.color))(d.name) : chalk.white(d.name));
		const m =
			level === 'error' ? chalk.red(message) :
			level === 'warning' ? chalk.yellow(message) :
			level === 'success' ? chalk.green(message) :
			level === 'debug' ? chalk.gray(message) :
			message;

		let log = `${l} ${worker}\t[${domains.join(' ')}]\t${m}`;
		if (envOption.withLogTime) log = chalk.gray(time) + ' ' + log;

		console.log(important ? chalk.bold(log) : log);

		if (store) {
			if (this.syslogClient) {
				const send =
					level === 'error' ? this.syslogClient.error :
					level === 'warning' ? this.syslogClient.warning :
					this.syslogClient.info;

				send.bind(this.syslogClient)(message).catch(() => {});
			}
		}
	}

	/**
	 * Log an error message.
	 * Use in situations where execution cannot be continued.
	 * @param err Error or string containing an error message
	 * @param data Data relating to the error
	 * @param important Whether this error is important
	 */
	public error(err: string | Error, data: Record<string, any> = {}, important = false): void {
		if (err instanceof Error) {
			data.e = err;
			this.log('error', err.toString(), data, important);
		} else if (typeof err === 'object') {
			this.log('error', `${(err as any).message || (err as any).name || err}`, data, important);
		} else {
			this.log('error', `${err}`, data, important);
		}
	}

	/**
	 * Log a warning message.
	 * Use in situations where execution can continue but needs to be improved.
	 * @param message Warning message
	 * @param data Data relating to the warning
	 * @param important Whether this warning is important
	 */
	public warn(message: string, data?: Record<string, any> | null, important = false): void {
		this.log('warning', message, data, important);
	}

	/**
	 * Log a success message.
	 * Use in situations where something has been successfully done.
	 * @param message Success message
	 * @param data Data relating to the success
	 * @param important Whether this success message is important
	 */
	public succ(message: string, data?: Record<string, any> | null, important = false): void {
		this.log('success', message, data, important);
	}

	/**
	 * Log a debug message.
	 * Use for debugging (information needed by developers but not required by users).
	 * @param message Debug message
	 * @param data Data relating to the debug message
	 * @param important Whether this debug message is important
	 */
	public debug(message: string, data?: Record<string, any> | null, important = false): void {
		if (process.env.NODE_ENV !== 'production' || envOption.verbose) {
			this.log('debug', message, data, important);
		}
	}

	/**
	 * Log an informational message.
	 * Use when something needs to be logged but doesn't fit into other levels.
	 * @param message Info message
	 * @param data Data relating to the info message
	 * @param important Whether this info message is important
	 */
	public info(message: string, data?: Record<string, any> | null, important = false): void {
		this.log('info', message, data, important);
	}
}
