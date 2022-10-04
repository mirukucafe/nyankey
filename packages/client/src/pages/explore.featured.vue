<template>
<MkSpacer :content-max="800">
	<MkTab v-model="tab" :options="tabs" style="margin-bottom: var(--margin);"/>
	<XNotes v-if="tab === 'notes'" :pagination="paginationForNotes"/>
	<XNotes v-else-if="tab === 'polls'" :pagination="paginationForPolls"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import XNotes from '@/components/notes.vue';
import MkTab from '@/components/tab.vue';
import { i18n } from '@/i18n';

const tabs = [{
	value: 'notes',
	label: i18n.ts.notes,
}, {
	value: 'polls',
	label: i18n.ts.poll,
}];

const paginationForNotes = {
	endpoint: 'notes/featured' as const,
	limit: 10,
	offsetMode: true,
};

const paginationForPolls = {
	endpoint: 'notes/polls/recommendation' as const,
	limit: 10,
	offsetMode: true,
};

let tab = $ref('notes');
</script>
