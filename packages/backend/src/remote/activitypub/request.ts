import { URL } from 'node:url';
import config from '@/config/index.js';
import { getUserKeypair } from '@/misc/keypair-store.js';
import { User } from '@/models/entities/user.js';
import { getResponse } from '@/misc/fetch.js';
import { createSignedPost, createSignedGet } from './ap-request.js';
import { apRequestChart, federationChart, instanceChart } from '@/services/chart/index.js';

/**
 * Post an activity to an inbox. Automatically updates the statistics
 * on succeeded or failed delivery attempts.
 *
 * @param user http-signature user
 * @param url The URL of the inbox.
 * @param object The Activity or other object to be posted to the inbox.
 */
export async function request(user: { id: User['id'] }, url: string, object: any): Promise<void> {
	const body = JSON.stringify(object);

	const keypair = await getUserKeypair(user.id);

	const req = createSignedPost({
		key: {
			privateKeyPem: keypair.privateKey,
			keyId: `${config.url}/users/${user.id}#main-key`,
		},
		url,
		body,
		additionalHeaders: {
			'User-Agent': config.userAgent,
		},
	});

	const { host } = new URL(url);

	try {
		await getResponse({
			url,
			method: req.request.method,
			headers: req.request.headers,
			body,
			// don't allow redirects on the inbox
			redirect: 'error',
		});

		instanceChart.requestSent(host, true);
		apRequestChart.deliverSucc();
		federationChart.deliverd(host, true);
	} catch (err) {
		instanceChart.requestSent(host, false);
		apRequestChart.deliverFail();
		federationChart.deliverd(host, false);

		throw err;
	}
}

/**
 * Get AP object with http-signature
 * @param user http-signature user
 * @param url URL to fetch
 */
export async function signedGet(_url: string, user: { id: User['id'] }): Promise<any> {
	let url = _url;
	const keypair = await getUserKeypair(user.id);

	for (let redirects = 0; redirects < 3; redirects++) {
		const req = createSignedGet({
			key: {
				privateKeyPem: keypair.privateKey,
				keyId: `${config.url}/users/${user.id}#main-key`,
			},
			url,
			additionalHeaders: {
				'User-Agent': config.userAgent,
			},
		});

		const res = await getResponse({
			url,
			method: req.request.method,
			headers: req.request.headers,
			redirect: 'manual',
		});

		if (res.status >= 300 && res.status < 400) {
			// Have been redirected, need to make a new signature.
			// Use Location header and fetched URL as the base URL.
			url = new URL(res.headers.get('Location'), url).href;
		} else {
			return await res.json();
		}
	}

	throw new Error('too many redirects');
}
