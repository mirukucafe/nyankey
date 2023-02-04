import * as fs from 'node:fs';
import * as stream from 'node:stream';
import * as util from 'node:util';
import chalk from 'chalk';
import got, * as Got from 'got';
import IPCIDR from 'ip-cidr';
import PrivateIp from 'private-ip';
import { SECOND, MINUTE } from '@/const.js';
import config from '@/config/index.js';
import Logger from '@/services/logger.js';
import { httpAgent, httpsAgent, StatusError } from './fetch.js';

const pipeline = util.promisify(stream.pipeline);

export async function downloadUrl(url: string, path: string): Promise<void> {
	const logger = new Logger('download');

	logger.info(`Downloading ${chalk.cyan(url)} ...`);

	const timeout = 30 * SECOND;
	const operationTimeout = MINUTE;

	const req = got.stream(url, {
		headers: {
			'User-Agent': config.userAgent,
		},
		timeout: {
			lookup: timeout,
			connect: timeout,
			secureConnect: timeout,
			socket: timeout,	// read timeout
			response: timeout,
			send: timeout,
			request: operationTimeout,	// whole operation timeout
		},
		agent: {
			http: httpAgent,
			https: httpsAgent,
		},
		http2: false,	// default
		retry: {
			limit: 0,
		},
	}).on('response', (res: Got.Response) => {
		if ((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') && !config.proxy && res.ip) {
			if (isPrivateIp(res.ip)) {
				logger.warn(`Blocked address: ${res.ip}`);
				req.destroy();
			}
		}

		const contentLength = res.headers['content-length'];
		if (contentLength != null) {
			const size = Number(contentLength);
			if (size > config.maxFileSize) {
				logger.warn(`maxSize exceeded (${size} > ${config.maxFileSize}) on response`);
				req.destroy();
			}
		}
	}).on('downloadProgress', (progress: Got.Progress) => {
		if (progress.transferred > config.maxFileSize) {
			logger.warn(`maxSize exceeded (${progress.transferred} > ${config.maxFileSize}) on downloadProgress`);
			req.destroy();
		}
	});

	try {
		await pipeline(req, fs.createWriteStream(path));
	} catch (e) {
		if (e instanceof Got.HTTPError) {
			throw new StatusError(`${e.response.statusCode} ${e.response.statusMessage}`, e.response.statusCode, e.response.statusMessage);
		} else {
			throw e;
		}
	}

	logger.succ(`Download finished: ${chalk.cyan(url)}`);
}

function isPrivateIp(ip: string): boolean {
	for (const net of config.allowedPrivateNetworks || []) {
		const cidr = new IPCIDR(net);
		if (cidr.contains(ip)) {
			return false;
		}
	}

	return PrivateIp(ip);
}
