import * as foundkey from 'foundkey-js';
import { markRaw } from 'vue';
import { $i } from '@/account';
import { url } from '@/config';

export const stream = markRaw(new foundkey.Stream(url, $i ? {
	token: $i.token,
} : null));
