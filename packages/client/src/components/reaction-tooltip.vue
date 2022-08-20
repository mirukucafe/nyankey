<template>
<MkTooltip ref="tooltip" :target-element="targetElement" :max-width="340" @closed="emit('closed')">
	<div class="beeadbfb">
		<MkEmoji :emoji="reaction" :custom-emojis="emojis" :is-reaction="true" :normal="true" class="icon" :no-style="true"/>
		<div class="name">{{ reaction.replace('@.', '') }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import MkTooltip from './ui/tooltip.vue';

defineProps<{
	reaction: string;
	emojis: Record<string, any>[]; // TODO
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" scoped>
.beeadbfb {
	text-align: center;

	> .icon {
		display: block;
		width: 60px;
		font-size: 60px; // unicodeな絵文字についてはwidthが効かないため
		margin: 0 auto;
	}

	> .name {
		font-size: 0.9em;
	}
}
</style>
