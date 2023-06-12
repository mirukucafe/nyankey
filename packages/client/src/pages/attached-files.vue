<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="800">
		<div class="attachments-timeline">
			<XTimeline
				ref="tl"
				class="tl"
				src="file"
				:fileId="fileId"
			/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XTimeline from '@/components/timeline.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

defineProps<{
	fileId: string;
}>();

definePageMetadata(computed(() => ({
	title: i18n.ts.attachedToNotes,
	icon: 'fas fa-paperclip',
})));
</script>

<style lang="scss" scoped>
.attachments-timeline {
	background: var(--bg);
	border-radius: var(--radius);
	overflow: clip;
}
</style>
