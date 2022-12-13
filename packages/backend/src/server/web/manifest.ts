import Koa from 'koa';
import { fetchMeta } from '@/misc/fetch-meta.js';
import manifest from './manifest.json' assert { type: 'json' };

export const manifestHandler = async (ctx: Koa.Context): Promise<void> => {
	const res = structuredClone(manifest);

	const instance = await fetchMeta(true);

	res.short_name = instance.name || 'FoundKey';
	res.name = instance.name || 'FoundKey';
	if (instance.themeColor) res.theme_color = instance.themeColor;

	ctx.set('Cache-Control', 'max-age=300');
	ctx.body = res;
};
