<template>
<div v-size="{ max: [500] }" class="pxhvhrfw">
	<button
		v-for="option in options"
		:key="option.value"
		:class="{ '_button': true, active: modelValue === option.value }"
		:disabled="modelValue === option.value"
		@click.stop="emit('update:modelValue', option.value)"
	>
		{{ option.label }}
	</button>
</div>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
	(ev: 'update:modelValue', value: string): void;
}>();

defineProps<{
	modelValue: string;
	options: {
		value: string;
		label: string;
	}[];
}>();
</script>

<style lang="scss">
.pxhvhrfw {
	display: flex;
	font-size: 90%;

	> button {
		flex: 1;
		padding: 10px 8px;
		border-radius: var(--radius);

		&:disabled {
			opacity: 1 !important;
			cursor: default;
		}

		&.active {
			color: var(--accent);
			background: var(--accentedBg);
		}

		&:not(.active):hover {
			color: var(--fgHighlighted);
			background: var(--panelHighlight);
		}

		&:not(:first-child) {
			margin-left: 8px;
		}

		> .icon {
			margin-right: 6px;
		}
	}

	&.max-width_500px {
		font-size: 80%;

		> button {
			padding: 11px 8px;
		}
	}
}
</style>
