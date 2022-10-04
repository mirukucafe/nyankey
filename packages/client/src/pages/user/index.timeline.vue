<template>
<div v-sticky-container class="yrzkoczt">
	<MkTab v-model="include" :options="tabs" class="tab"/>
	<XNotes :no-gap="true" :pagination="pagination"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as foundkey from 'foundkey-js';
import XNotes from '@/components/notes.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	user: foundkey.entities.UserDetailed;
}>();

const tabs = [{
	value: 'notes',
	label: i18n.ts.notes,
}, {
	value: 'replies',
	label: i18n.ts.notesAndReplies,
}, {
	value: 'files',
	label: i18n.ts.withFiles,
}];

let include: string = $ref('notes');

const pagination = {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => ({
		userId: props.user.id,
		includeReplies: include === 'replies',
		withFiles: include === 'files',
	})),
};
</script>

<style lang="scss" scoped>
.yrzkoczt {
	> .tab {
		margin: calc(var(--margin) / 2) 0;
		padding: calc(var(--margin) / 2) 0;
		background: var(--bg);
	}
}
</style>
