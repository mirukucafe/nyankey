import { EventEmitter } from 'events';
import * as http from 'node:http';
import { WebSocketServer } from 'ws';

import { SECOND, MINUTE } from '@/const.js';
import { subscriber as redisClient } from '@/db/redis.js';
import { Users } from '@/models/index.js';
import { Connection } from './stream/index.js';
import authenticate from './authenticate.js';

export const initializeStreamingServer = (server: http.Server): void => {
	// Init websocket server
	const ws = new WebSocketServer({ noServer: true });

	server.on('upgrade', async (request, socket, head)=> {
		if (!request.url.startsWith('/streaming?')) {
			socket.write('HTTP/1.1 400 Bad Request\r\n\r\n', undefined, () => socket.destroy());
			return;
		}
		const q = new URLSearchParams(request.url.slice(11));

		const [user, app] = await authenticate(request.headers.authorization, q.get('i'))
			.catch(err => {
				socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n', undefined, () => socket.destroy());
				return [];
			});
		if (typeof user === 'undefined') return;

		if (user?.isSuspended) {
			socket.write('HTTP/1.1 403 Forbidden\r\n\r\n', undefined, () => socket.destroy());
			return;
		}

		ws.handleUpgrade(request, socket, head, (socket) => {
			const ev = new EventEmitter();

			async function onRedisMessage(_: string, data: string) {
				const parsed = JSON.parse(data);
				ev.emit(parsed.channel, parsed.message);
			}

			redisClient.on('message', onRedisMessage);

			const main = new Connection(socket, ev, user, app);

			// ping/pong mechanism
			let pingTimeout = null;
			function startHeartbeat() {
				if (pingTimeout) clearTimeout(pingTimeout);

				socket.ping();
				pingTimeout = setTimeout(() => {
					socket.terminate();
				}, 30 * SECOND);
			}
			startHeartbeat();
			socket.on('ping', () => { startHeartbeat(); });
			socket.on('pong', () => { startHeartbeat(); });

			// keep user "online" while a stream is connected
			const intervalId = user ? setInterval(() => {
				Users.update(user.id, {
					lastActiveDate: new Date(),
				});
			}, 5 * MINUTE) : null;
			if (user) {
				Users.update(user.id, {
					lastActiveDate: new Date(),
				});
			}

			socket.once('close', () => {
				ev.removeAllListeners();
				main.dispose();
				redisClient.off('message', onRedisMessage);
				if (intervalId) clearInterval(intervalId);
				if (pingTimeout) clearTimeout(pingTimeout);
			});
		});
	});
};
