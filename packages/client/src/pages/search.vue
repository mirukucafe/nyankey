<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="800">
		<XNotes ref="notes" :pagination="pagination"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XNotes from '@/components/notes.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	query: string;
	channel?: string;
}>();

const pagination = {
	endpoint: 'notes/search' as const,
	limit: 10,
	params: computed(() => ({
		query: props.query,
		channelId: props.channel,
	})),
};

definePageMetadata(computed(() => ({
	title: i18n.t('searchWith', { q: props.query }),
	icon: 'fas fa-search',
})));
</script>
