<!-- eslint-disable vue/no-v-html -->
<template>
<div v-if="block" v-html="compiledFormula"></div>
<span v-else v-html="compiledFormula"></span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import katex from 'katex';

const props = defineProps<{
	formula: string;
	block: boolean;
}>();

const compiledFormula = computed(() => katex.renderToString(props.formula, {
	throwOnError: false,
}));
</script>

<style>
@import "katex/dist/katex.min.css";
</style>
