<template>
<div class="mrdgzndn">
	<Mfm :key="text" :text="text" :is-note="false"/>
	<MkUrlPreview v-for="url in urls" :key="url" :url="url" class="url"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, watch, computed } from 'vue';
import * as mfm from 'mfm-js';
import { TextBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';

const props = defineProps<{
	block: TextBlock;
	hpml: Hpml;
}>();

const MkUrlPreview = defineAsyncComponent(() => import('@/components/url-preview.vue'));

let text: string = $ref('');

const urls = computed((): string[] => {
	if (text) {
		return extractUrlFromMfm(mfm.parse(text));
	} else {
		return [];
	}
});

watch(props.hpml.vars, () => {
	text = props.hpml.interpolate(props.block.text) as string;
}, {
	deep: true,
	immediate: true,
});
</script>

<style lang="scss" scoped>
.mrdgzndn {
	padding-left: 1em;
	padding-right: 1em;

	&:not(:first-child) {
		margin-top: 0.5em;
	}

	&:not(:last-child) {
		margin-bottom: 0.5em;
	}

	> .url {
		margin: 0.5em 0;
	}
}
</style>
