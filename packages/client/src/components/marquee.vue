<template>
<div class="marquee">
	<span ref="contentEl" :class="{ content: true, paused, reverse }">
		<span v-for="i in repeat" :key="i" class="text">
			<slot></slot>
		</span>
	</span>
</div>
</template>

<script lang="ts" setup>
import { watch, onMounted } from 'vue';

const props = withDefaults(defineProps<{
	duration?: number;
	repeat?: number;
	paused?: boolean;
	reverse?: boolean;
}>(), {
	duration: 15,
	repeat: 2,
	paused: false,
	reverse: false,
});

let contentEl: HTMLElement = $ref();

function calc(): void {
	const eachLength = contentEl.offsetWidth / props.repeat;
	const factor = 3000;
	const duration = props.duration / ((1 / eachLength) * factor);

	contentEl.style.animationDuration = `${duration}s`;
}

watch(() => props.duration, calc);
onMounted(calc);
</script>

<style lang="scss" scoped>
.marquee {
	overflow: clip;
	animation-play-state: running;

	&:hover {
		animation-play-state: paused;
	}

	> .content {
		display: inline-block;
		white-space: nowrap;
		animation-play-state: inherit;

		&.paused {
			animation-play-state: paused;
		}

		&.reverse {
			animation-direction: reverse;
		}

		> .text {
			display: inline-block;
			animation-name: marquee;
			animation-timing-function: linear;
			animation-iteration-count: infinite;
			animation-duration: inherit;
			animation-play-state: inherit;
		}
	}
}

@keyframes marquee {
	0% { transform:translateX(0); }
	100% { transform:translateX(-100%); }
}
</style>
