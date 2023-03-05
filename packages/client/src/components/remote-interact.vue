<template>
<XModalWindow
	ref="dialog"
	:width="700"
	@close="onClose()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts._remoteInteract.title }}</template>

	<MkSpacer :margin-min="20" :margin-max="32" class="remote-interact" style="padding-top: 0;">
		<p>{{ i18n.ts._remoteInteract.description }}</p>
		<section>
			<p>{{ i18n.ts._remoteInteract.urlInstructions }}</p>
			<a :href="remoteUrl">{{ remoteUrl }}</a>
			<button v-tooltip="i18n.ts.copyUrl" class="_textButton" @click="copyUrl"><i class="far fa-copy"></i></button>
		</section>
		<aside>
			<button class="_button" @click="signin()">{{ i18n.ts.login }}</button>
			<button class="_button" @click="onClose()">{{ i18n.ts.cancel }}</button>
		</aside>
	</MkSpacer>
</XModalWindow>
</template>

<script lang="ts" setup>
import XModalWindow from '@/components/ui/modal-window.vue';
import XSigninDialog from '@/components/signin-dialog.vue';
import { i18n } from '@/i18n';
import * as os from '@/os';

const props = defineProps<{
	remoteUrl: string;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = $ref<InstanceType<typeof XModalWindow>>();

function onClose(): void {
    emit('closed');
    dialog.close();
}

function signin() {
	os.popup(XSigninDialog, {
		autoSet: true,
	}, {}, 'closed');
}

function copyUrl() {
    copyToClipboard(props.remoteUrl);
    os.success();
}
</script>

<style lang="scss" scoped>
.remote-interact {
	section {
		padding: var(--radius);
		border-radius: var(--radius);
		border: solid .2em var(--accentDarken);

		> p {
			margin-top: 0;
		}

		> button {
			margin-left: .5em;
		}
	}

	aside {
		background-color: var(--bg);
		border-radius: var(--radius);
		margin-top: 1em;

		> button {
			padding: 1em;
			border-radius: 2em;
			background-color: var(--navBg);
			color: var(--navFg);
			margin: .5em;
		}
	}
}
</style>
