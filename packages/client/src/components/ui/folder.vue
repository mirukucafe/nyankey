<template>
<div ref="folderEl" v-size="{ max: [500] }" class="ssazuxis">
	<header class="_button" :style="{ background: bg ?? undefined }" @click="showBody = !showBody">
		<div class="title"><slot name="header"></slot></div>
		<div class="divider"></div>
		<button class="_button">
			<template v-if="showBody"><i class="fas fa-angle-up"></i></template>
			<template v-else><i class="fas fa-angle-down"></i></template>
		</button>
	</header>
	<transition
		:name="$store.state.animation ? 'folder-toggle' : ''"
		@enter="enter"
		@after-enter="removeHeight"
		@leave="leave"
		@after-leave="removeHeight"
	>
		<div v-show="showBody">
			<slot></slot>
		</div>
	</transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue';
import tinycolor from 'tinycolor2';

const localStoragePrefix = 'ui:folder:';

const props = withDefaults(defineProps<{
	expanded?: boolean;
	persistKey?: string;
}>(), {
	expanded: true,
});

let bg: string | null = $ref(null);
let showBody = $ref((props.persistKey && localStorage.getItem(localStoragePrefix + props.persistKey)) ? localStorage.getItem(localStoragePrefix + props.persistKey) === 't' : props.expanded);
let folderEl: HTMLElement | null = $ref(null);

watch($$(showBody), () => {
	if (props.persistKey) {
		localStorage.setItem(localStoragePrefix + props.persistKey, showBody ? 't' : 'f');
	}
});

onMounted(() => {
	function getParentBg(el: HTMLElement | null): string {
		if (el == null || el.tagName === 'BODY') return 'var(--bg)';
		const elBg = el.style.background || el.style.backgroundColor;
		if (elBg) {
			return elBg;
		} else {
			return getParentBg(el.parentElement);
		}
	}
	const rawBg = getParentBg(folderEl);
	const newBg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
	newBg.setAlpha(0.85);
	bg = newBg.toRgbString();
});

function enter(el: HTMLElement): void {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = '0';
	el.offsetHeight; // reflow
	el.style.height = elementHeight + 'px';
}

function removeHeight(el: HTMLElement): void {
	el.style.removeProperty('height');
}

function leave(el: HTMLElement): void {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = elementHeight + 'px';
	el.offsetHeight; // reflow
	el.style.height = '0';
}
</script>

<style lang="scss" scoped>
.folder-toggle-enter-active, .folder-toggle-leave-active {
	overflow-y: hidden;
	transition: opacity 0.5s, height 0.5s !important;
}
.folder-toggle-enter-from {
	opacity: 0;
}
.folder-toggle-leave-to {
	opacity: 0;
}

.ssazuxis {
	position: relative;

	> header {
		display: flex;
		position: relative;
		z-index: 10;
		position: sticky;
		top: var(--stickyTop, 0px);
		padding: var(--x-padding);
		-webkit-backdrop-filter: var(--blur, blur(8px));
		backdrop-filter: var(--blur, blur(20px));

		> .title {
			margin: 0;
			padding: 12px 16px 12px 0;

			> i {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .divider {
			flex: 1;
			margin: auto;
			height: 1px;
			background: var(--divider);
		}

		> button {
			padding: 12px 0 12px 16px;
		}
	}

	&.max-width_500px {
		> header {
			> .title {
				padding: 8px 10px 8px 0;
			}
		}
	}
}
</style>
