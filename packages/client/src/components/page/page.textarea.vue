<template>
<MkTextarea :model-value="text" readonly></MkTextarea>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import MkTextarea from '../form/textarea.vue';
import { TextBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';

const props = defineProps<{
	block: TextBlock;
	hpml: Hpml;
}>();

let text = $ref(props.hpml.interpolate(props.block.text));

watch(props.hpml.vars, () => {
	text = props.hpml.interpolate(props.block.text);
}, {
	deep: true,
});
</script>
