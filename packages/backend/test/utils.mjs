import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as childProcess from 'child_process';
import * as http from 'node:http';
import { SIGKILL } from 'constants';
import WebSocket from 'ws';
import * as foundkey from 'foundkey-js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { DataSource } from 'typeorm';
import { loadConfig } from '../built/config/load.js';
import { entities } from '../built/db/postgre.js';
import got from 'got';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const config = loadConfig();
export const port = config.port;

export const async = (fn) => (done) => {
	fn().then(() => {
		done();
	}, (err) => {
		done(err);
	});
};

export const api = async (endpoint, params, me) => {
	endpoint = endpoint.replace(/^\//, '');

	const auth = me ? { authorization: `Bearer ${me.token}` } : {};

	const res = await got(`http://localhost:${port}/api/${endpoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...auth,
		},
		body: JSON.stringify(params),
		retry: {
			limit: 0,
		},
		hooks: {
			beforeError: [
				error => {
					const { response } = error;
					if (response && response.body) console.warn(response.body);
					return error;
				}
			]
		},
	});

	const status = res.statusCode;
	const body = res.statusCode !== 204 ? await JSON.parse(res.body) : null;

	return {
		status,
		body
	};
};

export const request = async (endpoint, params, me) => {
	const auth = me ? { authorization: `Bearer ${me.token}` } : {};

	const res = await fetch(`http://localhost:${port}/api${endpoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...auth,
		},
		body: JSON.stringify(params),
	});

	const status = res.status;
	const body = res.status !== 204 ? await res.json().catch() : null;

	return {
		body, status,
	};
};

export const signup = async (params) => {
	const q = Object.assign({
		username: 'test',
		password: 'test',
	}, params);

	const res = await api('signup', q);

	return res.body;
};

export const post = async (user, params) => {
	const q = Object.assign({
		text: 'test',
	}, params);

	const res = await api('notes/create', q, user);

	return res.body ? res.body.createdNote : null;
};

export const react = async (user, note, reaction) => {
	await api('notes/reactions/create', {
		noteId: note.id,
		reaction: reaction,
	}, user);
};

/**
 * Upload file
 * @param user User
 * @param _path Optional, absolute path or relative from ./resources/
 */
export const uploadFile = async (user, _path) => {
	const absPath = _path == null ? `${_dirname}/resources/Lenna.jpg` : path.isAbsolute(_path) ? _path : `${_dirname}/resources/${_path}`;

	const formData = new FormData();
	formData.append('i', user.token);
	formData.append('file', fs.createReadStream(absPath));
	formData.append('force', 'true');

	const res = await got<string>(`http://localhost:${port}/api/drive/files/create`, {
		method: 'POST',
		body: formData,
		retry: {
			limit: 0,
		},
	});

	const body = res.statusCode !== 204 ? await JSON.parse(res.body) : null;

	return body;
};

export const uploadUrl = async (user, url) => {
	let file;

	const ws = await connectStream(user, 'main', (msg) => {
		if (msg.type === 'driveFileCreated') {
			file = msg.body;
		}
	});

	await api('drive/files/upload-from-url', {
		url,
		force: true,
	}, user);

	await sleep(5000);
	ws.close();

	return file;
};

export function connectStream(user, channel, listener, params) {
	return new Promise((res, rej) => {
		const ws = new WebSocket(`ws://localhost:${port}/streaming?i=${user.token}`);

		ws.on('open', () => {
			ws.on('message', data => {
				const msg = JSON.parse(data.toString());
				if (msg.type === 'channel' && msg.body.id === 'a') {
					listener(msg.body);
				} else if (msg.type === 'connected' && msg.body.id === 'a') {
					res(ws);
				}
			});

			ws.send(JSON.stringify({
				type: 'connect',
				body: {
					channel: channel,
					id: 'a',
					pong: true,
					params: params,
				},
			}));
		});
	});
}

export const waitFire = async (user, channel, trgr, cond, params) => {
	return new Promise(async (res, rej) => {
		let timer;

		let ws;
		try {
			ws = await connectStream(user, channel, msg => {
				if (cond(msg)) {
					ws.close();
					if (timer) clearTimeout(timer);
					res(true);
				}
			}, params);
		} catch (e) {
			rej(e);
		}

		if (!ws) return;

		timer = setTimeout(() => {
			ws.close();
			res(false);
		}, 3000);

		try {
			await trgr();
		} catch (e) {
			ws.close();
			if (timer) clearTimeout(timer);
			rej(e);
		}
	})
};

export const simpleGet = async (path, accept = '*/*') => {
	// node-fetchだと3xxを取れない
	return await new Promise((resolve, reject) => {
		const req = http.request(`http://localhost:${port}${path}`, {
			headers: {
				Accept: accept,
			},
		}, res => {
			if (res.statusCode >= 400) {
				reject(res);
			} else {
				resolve({
					status: res.statusCode,
					type: res.headers['content-type'],
					location: res.headers.location,
				});
			}
		});

		req.end();
	});
};

export function launchServer(callbackSpawnedProcess, moreProcess = async () => {}) {
	return (done) => {
		const p = childProcess.spawn('node', [_dirname + '/../index.js'], {
			stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
			env: { NODE_ENV: 'test', PATH: process.env.PATH },
		});
		callbackSpawnedProcess(p);
		p.on('message', message => {
			if (message === 'ok') moreProcess().then(() => done()).catch(e => done(e));
		});
	};
}

export async function initTestDb(justBorrow = false, initEntities) {
	if (process.env.NODE_ENV !== 'test') throw 'NODE_ENV is not a test';

	const db = new DataSource({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		synchronize: true && !justBorrow,
		dropSchema: true && !justBorrow,
		entities: initEntities || entities,
	});

	await db.initialize();

	return db;
}

export function startServer(timeout = 60 * 1000) {
	return new Promise((res, rej) => {
		const t = setTimeout(() => {
			p.kill(SIGKILL);
			rej('timeout to start');
		}, timeout);

		const p = childProcess.spawn('node', [_dirname + '/../built/index.js'], {
			stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
			env: { NODE_ENV: 'test', PATH: process.env.PATH },
		});

		p.on('error', e => rej(e));

		p.on('message', message => {
			if (message === 'ok') {
				clearTimeout(t);
				res(p);
			}
		});
	});
}

export function shutdownServer(p, timeout = 20 * 1000) {
	return new Promise((res, rej) => {
		const t = setTimeout(() => {
			p.kill(SIGKILL);
			res('force exit');
		}, timeout);

		p.once('exit', () => {
			clearTimeout(t);
			res('exited');
		});

		p.kill();
	});
}

export function sleep(msec) {
	return new Promise(res => {
		setTimeout(() => {
			res();
		}, msec);
	});
}
