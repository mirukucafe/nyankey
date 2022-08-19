<template>
<XFormula :formula="formula" :block="block"/>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';

const XFormula = defineAsyncComponent(() => import('./formula-core.vue'));
defineProps<{
	formula: string;
	block: boolean;
}>();
</script>
