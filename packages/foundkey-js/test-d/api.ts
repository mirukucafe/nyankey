import { expectType } from 'tsd';
import * as foundkey from '../src';

describe('API', () => {
	test('success', async () => {
		const cli = new foundkey.api.APIClient({
			origin: 'https://foundkey.test',
			credential: 'TOKEN'
		});
		const res = await cli.request('meta', { detail: true });
		expectType<foundkey.entities.DetailedInstanceMetadata>(res);
	});

	test('conditional respose type (meta)', async () => {
		const cli = new foundkey.api.APIClient({
			origin: 'https://foundkey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('meta', { detail: true });
		expectType<foundkey.entities.DetailedInstanceMetadata>(res);

		const res2 = await cli.request('meta', { detail: false });
		expectType<foundkey.entities.LiteInstanceMetadata>(res2);

		const res3 = await cli.request('meta', { });
		expectType<foundkey.entities.LiteInstanceMetadata>(res3);

		const res4 = await cli.request('meta', { detail: true as boolean });
		expectType<foundkey.entities.LiteInstanceMetadata | foundkey.entities.DetailedInstanceMetadata>(res4);
	});

	test('conditional respose type (users/show)', async () => {
		const cli = new foundkey.api.APIClient({
			origin: 'https://foundkey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('users/show', { userId: 'xxxxxxxx' });
		expectType<foundkey.entities.UserDetailed>(res);

		const res2 = await cli.request('users/show', { userIds: ['xxxxxxxx'] });
		expectType<foundkey.entities.UserDetailed[]>(res2);
	});
});
