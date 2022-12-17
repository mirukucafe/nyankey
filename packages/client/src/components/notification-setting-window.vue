<template>
<XModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:with-ok-button="true"
	:ok-button-disabled="false"
	@ok="ok()"
	@close="dialog.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.notificationSetting }}</template>
	<div class="_monolithic_">
		<div v-if="showGlobalToggle" class="_section">
			<FormSwitch v-model="useGlobalSetting">
				{{ i18n.ts.useGlobalSetting }}
				<template #caption>{{ i18n.ts.useGlobalSettingDesc }}</template>
			</FormSwitch>
		</div>
		<div v-if="!useGlobalSetting" class="_section">
			<MkInfo>{{ message }}</MkInfo>
			<MkButton inline @click="disableAll">{{ i18n.ts.disableAll }}</MkButton>
			<MkButton inline @click="enableAll">{{ i18n.ts.enableAll }}</MkButton>
			<FormSwitch v-for="ntype in notificationTypes" :key="ntype" v-model="typesMap[ntype]">{{ i18n.t(`_notification._types.${ntype}`) }}</FormSwitch>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts" setup>
import * as foundkey from 'foundkey-js';
import FormSwitch from './form/switch.vue';
import MkInfo from './ui/info.vue';
import MkButton from './ui/button.vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import { i18n } from '@/i18n';

const emit = defineEmits<{
	(ev: 'done', v: { includingTypes: string[] | null }): void,
	(ev: 'closed'): void,
}>();

const props = withDefaults(defineProps<{
	includingTypes?: typeof foundkey.notificationTypes[number][] | null;
	notificationTypes?: typeof foundkey.notificationTypes[number][] | null;
	showGlobalToggle?: boolean;
	message?: string,
}>(), {
	includingTypes: () => [],
	notificationTypes: foundkey.notificationTypes,
	showGlobalToggle: true,
	message: i18n.ts.notificationSettingDesc,
});

let includingTypes = $computed(() => props.includingTypes || []);

const dialog = $ref<InstanceType<typeof XModalWindow>>();

let typesMap = $ref<Record<typeof foundkey.notificationTypes[number], boolean>>({});
let useGlobalSetting = $ref((includingTypes === null || includingTypes.length === 0) && props.showGlobalToggle);

for (const ntype of props.notificationTypes) {
	typesMap[ntype] = includingTypes.includes(ntype);
}

function ok() {
	if (useGlobalSetting) {
		emit('done', { includingTypes: null });
	} else {
		emit('done', {
			includingTypes: (Object.keys(typesMap) as typeof foundkey.notificationTypes[number][])
				.filter(type => typesMap[type]),
		});
	}

	dialog.close();
}

function disableAll() {
	for (const type in typesMap) {
		typesMap[type as typeof foundkey.notificationTypes[number]] = false;
	}
}

function enableAll() {
	for (const type in typesMap) {
		typesMap[type as typeof foundkey.notificationTypes[number]] = true;
	}
}
</script>
