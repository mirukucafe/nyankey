import { defineAsyncComponent } from 'vue';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { popup } from '@/os';
import { url } from '@/config';
import { entities } from 'foundkey-js';

export function pleaseLoginOrPage(path?: string) {
	if ($i) return;

	popup(defineAsyncComponent(() => import('@/components/signin-dialog.vue')), {
		autoSet: true,
		message: i18n.ts.signinRequired,
	}, {
		cancelled: () => {
			if (path) {
				window.location.href = path;
			}
		},
	}, 'closed');

	if (!path) throw new Error('signin required');
}

export function pleaseLoginOrRemote(url: string) {
	if ($i) return;

	popup(defineAsyncComponent(() => import('@/components/remote-interact.vue')), {
		remoteUrl,
	}, {}, 'closed');

	throw new Error('signin required');
}

export function urlForNote(note: entities.Note): string {
	return note.url
		?? note.uri
		?? `${url}/notes/${note.id}`;
}
