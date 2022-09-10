<template>
<span class="ceaaebcd" :class="{ isPlus, isMinus, isZero }">
	<slot name="before"></slot>{{ isPlus ? '+' : '' }}{{ number(value) }}<slot name="after"></slot>
</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import number from '@/filters/number';

const props = defineProps<{
	value: number;
}>();

const isPlus = computed(() => props.value > 0);
const isMinus = computed(() => props.value < 0);
const isZero = computed(() => props.value === 0);
</script>

<style lang="scss" scoped>
.ceaaebcd {
	&.isPlus {
		color: var(--success);
	}

	&.isMinus {
		color: var(--error);
	}

	&.isZero {
		opacity: 0.5;
	}
}
</style>
