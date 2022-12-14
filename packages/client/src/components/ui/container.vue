<template>
<div ref="containerEl" v-size="{ max: [380] }" class="ukygtjoj _panel" :class="{ naked, thin, hideHeader: !showHeader, scrollable, closed: !showBody }">
	<header v-if="showHeader" ref="header">
		<div class="title"><slot name="header"></slot></div>
		<div class="sub">
			<slot name="func"></slot>
			<button v-if="foldable" class="_button" @click="() => showBody = !showBody">
				<template v-if="showBody"><i class="fas fa-angle-up"></i></template>
				<template v-else><i class="fas fa-angle-down"></i></template>
			</button>
		</div>
	</header>
	<transition
		:name="$store.state.animation ? 'container-toggle' : ''"
		@enter="enter"
		@after-enter="removeHeight"
		@leave="leave"
		@after-leave="removeHeight"
	>
		<div v-show="showBody" ref="content" class="content" :class="{ omitted }">
			<slot></slot>
			<button v-if="omitted" class="fade _button" @click="() => { ignoreOmit = true; omitted = false; }">
				<span>{{ i18n.ts.showMore }}</span>
			</button>
		</div>
	</transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	showHeader?: boolean;
	thin?: boolean;
	naked?: boolean;
	foldable?: boolean;
	expanded?: boolean;
	scrollable?: boolean;
	maxHeight?: number | null;
}>(), {
	showHeader: true,
	thin: false,
	naked: false,
	foldable: false,
	expanded: true,
	scrollable: false,
	maxHeight: null,
});

let showBody: boolean = $ref(props.expanded);
let omitted: boolean = $ref(false);
let ignoreOmit: boolean = $ref(false);
let containerEl: HTMLElement | null = $ref(null);
let header: HTMLElement | null = $ref(null);
let content: HTMLElement | null = $ref(null);

onMounted(() => {
	watch($$(showBody), showBody_ => {
		if (header && containerEl) {
			const headerHeight = props.showHeader ? header.offsetHeight : 0;
			containerEl.style.minHeight = `${headerHeight}px`;
			if (showBody_) {
				containerEl.style.flexBasis = 'auto';
			} else {
				containerEl.style.flexBasis = `${headerHeight}px`;
			}
		}
	}, {
		immediate: true,
	});
	if (containerEl && props.maxHeight != null) {
		containerEl.style.setProperty('--maxHeight', props.maxHeight + 'px');
	}

	const calcOmit = (): void => {
		if (omitted || ignoreOmit || props.maxHeight == null) return;

		if (content) {
			const height = content.offsetHeight;
			omitted = height > props.maxHeight;
		}
	};

	if (content) {
		calcOmit();
		new ResizeObserver(() => {
			calcOmit();
		}).observe(content);
	}
});

function enter(el: HTMLElement): void {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = '0';
	el.offsetHeight; // reflow
	el.style.height = elementHeight + 'px';
}

function leave(el: HTMLElement): void {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = elementHeight + 'px';
	el.offsetHeight; // reflow
	el.style.height = '0';
}

function removeHeight(el: HTMLElement): void {
	el.style.removeProperty('height');
}
</script>

<style lang="scss" scoped>
.container-toggle-enter-active, .container-toggle-leave-active {
	overflow-y: hidden;
	transition: opacity 0.5s, height 0.5s !important;
}
.container-toggle-enter-from {
	opacity: 0;
}
.container-toggle-leave-to {
	opacity: 0;
}

.ukygtjoj {
	position: relative;
	overflow: clip;

	&.naked {
		background: transparent !important;
		box-shadow: none !important;
	}

	&.scrollable {
		display: flex;
		flex-direction: column;

		> .content {
			overflow: auto;
		}
	}

	> header {
		position: sticky;
		top: var(--stickyTop, 0px);
		left: 0;
		color: var(--panelHeaderFg);
		background: var(--panelHeaderBg);
		border-bottom: solid 0.5px var(--panelHeaderDivider);
		z-index: 2;
		line-height: 1.4em;

		> .title {
			margin: 0;
			padding: 12px 16px;

			> ::v-deep(i) {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .sub {
			position: absolute;
			z-index: 2;
			top: 0;
			right: 0;
			height: 100%;

			> ::v-deep(button) {
				width: 42px;
				height: 100%;
			}
		}
	}

	> .content {
		--stickyTop: 0px;

		&.omitted {
			position: relative;
			max-height: var(--maxHeight);
			overflow: hidden;

			> .fade {
				display: block;
				position: absolute;
				z-index: 10;
				bottom: 0;
				left: 0;
				width: 100%;
				height: 64px;
				background: linear-gradient(0deg, var(--panel), var(--X15));

				> span {
					display: inline-block;
					background: var(--panel);
					padding: 6px 10px;
					font-size: 0.8em;
					border-radius: 999px;
					box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
				}

				&:hover {
					> span {
						background: var(--panelHighlight);
					}
				}
			}
		}
	}

	&.max-width_380px, &.thin {
		> header {
			> .title {
				padding: 8px 10px;
				font-size: 0.9em;
			}
		}
	}
}

._forceContainerFull_ .ukygtjoj {
	> header {
		> .title {
			padding: 12px 16px !important;
		}
	}
}

._forceContainerFull_.ukygtjoj {
	> header {
		> .title {
			padding: 12px 16px !important;
		}
	}
}
</style>
