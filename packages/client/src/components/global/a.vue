<template>
<a :href="to" :class="active ? activeClass : null" @click.prevent="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts" setup>
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';

const props = withDefaults(defineProps<{
	to: string;
	activeClass?: null | string;
	behavior?: null | 'window' | 'browser' | 'modalWindow';
}>(), {
	activeClass: null,
	behavior: null,
});

const router = useRouter();

const active = $computed(() => {
	if (props.activeClass == null) return false;
	const resolved = router.resolve(props.to);
	if (resolved == null) return false;
	if (resolved.route.path === router.currentRoute.value.path) return true;
	if (resolved.route.name == null) return false;
	if (router.currentRoute.value.name == null) return false;
	return resolved.route.name === router.currentRoute.value.name;
});

function onContextmenu(ev) {
	const selection = window.getSelection();
	if (selection && selection.toString() !== '') return;
	os.contextMenu([{
		type: 'label',
		text: props.to,
	}, {
		icon: 'fas fa-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(props.to);
		},
	}, {
		icon: 'fas fa-expand-alt',
		text: i18n.ts.showInPage,
		action: () => {
			router.push(props.to);
		},
	}, null, {
		icon: 'fas fa-external-link-alt',
		text: i18n.ts.openInNewTab,
		action: () => {
			window.open(props.to, '_blank');
		},
	}, {
		icon: 'fas fa-link',
		text: i18n.ts.copyLink,
		action: () => {
			copyToClipboard(`${url}${props.to}`);
		},
	}], ev);
}

function nav() {
	if (props.behavior === 'browser') {
		location.href = props.to;
	} else if (props.behavior === 'window') {
		os.pageWindow(props.to);
	} else if (props.behavior === 'modalWindow') {
		os.modalPageWindow(props.to);
	} else {
		router.push(props.to);
	}
}
</script>
