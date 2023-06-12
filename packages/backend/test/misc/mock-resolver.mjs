import { Resolver } from '../../built/remote/activitypub/resolver.js';

export class MockResolver extends Resolver {
	_rs = new Map();

	async _register(uri, content, type = 'application/activity+json') {
		this._rs.set(uri, {
			type,
			content: typeof content === 'string' ? content : JSON.stringify(content),
		});
	}

	async resolve(value) {
		if (typeof value !== 'string') return value;

		const r = this._rs.get(value);

		if (!r) {
			throw {
				name: 'StatusError',
				statusCode: 404,
				message: 'Not registed for mock',
			};
		}

		const object = JSON.parse(r.content);

		return object;
	}
}
