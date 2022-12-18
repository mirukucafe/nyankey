<template>
<XModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:with-ok-button="true"
	:ok-button-disabled="false"
	:can-close="false"
	@close="dialog?.close()"
	@closed="emit('closed')"
	@ok="ok()"
>
	<template #header>{{ title }}</template>
	<div v-if="information" class="_section">
		<MkInfo warn>{{ information }}</MkInfo>
	</div>
	<div class="_section">
		<FormInput v-model="name">
			<template #label>{{ i18n.ts.name }}</template>
		</FormInput>
	</div>
	<div class="_section">
		<div style="margin-bottom: 16px;"><b>{{ i18n.ts.permission }}</b></div>
		<MkButton inline @click="disableAll">{{ i18n.ts.disableAll }}</MkButton>
		<MkButton inline @click="enableAll">{{ i18n.ts.enableAll }}</MkButton>
		<FormSwitch v-for="kind in kinds" :key="kind" v-model="permissions[kind]">{{ i18n.t(`_permissions.${kind}`) }}</FormSwitch>
	</div>
</XModalWindow>
</template>

<script lang="ts" setup>
import { permissions } from 'foundkey-js';
import FormInput from './form/input.vue';
import FormSwitch from './form/switch.vue';
import MkButton from './ui/button.vue';
import MkInfo from './ui/info.vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	title?: string;
	information?: string | null;
	initialName?: string;
	initialPermissions?: string[];
}>(), {
	title: i18n.ts.generateAccessToken,
	information: null,
	initialName: '',
	initialPermissions: () => [] as string[],
});

const emit = defineEmits<{
	(ev: 'done', result: { name: string; permissions: string[]; }): void;
	(ev: 'closed'): void;
}>();

let dialog: InstanceType<typeof XModalWindow> | null = $ref(null);
let name = $ref(props.initialName);
let perms: Record<string, boolean> = $ref({});
let kinds = props.initialPermissions.length > 0
	? props.initialPermissions
	: permissions;

// If there is a particular set of permissions given, enable all of them.
// Otherwise, by default disable all permissions.
const enable = props.initialPermissions.length > 0;
for (const kind of kinds) {
	perms[kind] = enable;
}

function ok(): void {
	emit('done', {
		name,
		permissions: Object.keys(perms).filter(p => perms[p]),
	});
	dialog?.close();
}

function disableAll(): void {
	for (const p in perms) {
		perms[p] = false;
	}
}

function enableAll(): void {
	for (const p in perms) {
		perms[p] = true;
	}
}
</script>
