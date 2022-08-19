<template>
<transition :name="$store.state.animation ? 'window' : ''" appear @after-leave="emit('closed')">
	<div v-if="showing" ref="main" class="ebkgocck">
		<div class="body _shadow _narrow_" @mousedown="moveToTop" @keydown="onKeydown">
			<div class="header" :class="{ mini }" @contextmenu.prevent.stop="onContextmenu">
				<span class="left">
					<button v-for="button in buttonsLeft" v-tooltip="button.title" class="button _button" :class="{ highlighted: button.highlighted }" @click="button.onClick"><i :class="button.icon"></i></button>
				</span>
				<span class="title" @mousedown.prevent="onHeaderMousedown" @touchstart.prevent="onHeaderMousedown">
					<slot name="header"></slot>
				</span>
				<span class="right">
					<button v-for="button in buttonsRight" v-tooltip="button.title" class="button _button" :class="{ highlighted: button.highlighted }" @click="button.onClick"><i :class="button.icon"></i></button>
					<button v-if="closeButton" class="button _button" @click="close()"><i class="fas fa-times"></i></button>
				</span>
			</div>
			<div class="body">
				<slot></slot>
			</div>
		</div>
		<template v-if="canResize">
			<div class="handle top" @mousedown.prevent="onTopHandleMousedown"></div>
			<div class="handle right" @mousedown.prevent="onRightHandleMousedown"></div>
			<div class="handle bottom" @mousedown.prevent="onBottomHandleMousedown"></div>
			<div class="handle left" @mousedown.prevent="onLeftHandleMousedown"></div>
			<div class="handle top-left" @mousedown.prevent="onTopLeftHandleMousedown"></div>
			<div class="handle top-right" @mousedown.prevent="onTopRightHandleMousedown"></div>
			<div class="handle bottom-right" @mousedown.prevent="onBottomRightHandleMousedown"></div>
			<div class="handle bottom-left" @mousedown.prevent="onBottomLeftHandleMousedown"></div>
		</template>
	</div>
</transition>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, provide } from 'vue';
import contains from '@/scripts/contains';
import * as os from '@/os';
import { MenuItem } from '@/types/menu';

const minHeight = 50;
const minWidth = 250;

function addMouseListener(fn: (this: Window, ev: MouseEvent) => void): void {
	window.addEventListener('mousemove', fn);
	window.addEventListener('mouseleave', removeMouseListener.bind(null, fn));
	window.addEventListener('mouseup', removeMouseListener.bind(null, fn));
}

function removeMouseListener(fn: (this: Window, ev: MouseEvent) => void): void {
	window.removeEventListener('mousemove', fn);
	window.removeEventListener('mouseleave', removeMouseListener.bind(null, fn));
	window.removeEventListener('mouseup', removeMouseListener.bind(null, fn));
}

function addTouchListener(fn: (this: Window, ev: TouchEvent) => void): void {
	window.addEventListener('touchmove', fn);
	window.addEventListener('touchend', removeTouchListener.bind(null, fn));
}

function removeTouchListener(fn: (this: Window, ev: TouchEvent) => void): void {
	window.removeEventListener('touchmove', fn);
	window.removeEventListener('touchend', removeTouchListener.bind(null, fn));
}

const props = withDefaults(defineProps<{
	initialWidth?: number;
	initialHeight?: number;
	canResize?: boolean;
	closeButton?: boolean;
	mini?: boolean;
	front?: boolean;
	contextmenu?: MenuItem[];
	buttonsLeft?: any[];
	buttonsRight?: any[];
}>(), {
	initialWidth: 400,
	canResize: false,
	closeButton: true,
	mini: false,
	front: false,
	contextmenu: () => [] as MenuItem[],
	buttonsLeft: () => [],
	buttonsRight: () => [],
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

provide('inWindow', true);

let showing = $ref(true);
let main: HTMLElement = $ref();

onMounted(() => {
	if (props.initialWidth) applyTransformWidth(props.initialWidth);
	if (props.initialHeight) applyTransformHeight(props.initialHeight);

	applyTransformTop((window.innerHeight / 2) - (main.offsetHeight / 2));
	applyTransformLeft((window.innerWidth / 2) - (main.offsetWidth / 2));
	// 他のウィンドウ内のボタンなどを押してこのウィンドウが開かれた場合、親が最前面になろうとするのでそれに隠されないようにする
	moveToTop();

	window.addEventListener('resize', onBrowserResize);
});

onUnmounted(() => {
	window.removeEventListener('resize', onBrowserResize);
});

function close(): void {
	showing = false;
}

function onKeydown(evt: KeyboardEvent): void {
	if (evt.key === 'Esc') {
		evt.preventDefault();
		evt.stopPropagation();
		close();
	}
}

function onContextmenu(ev: MouseEvent): void {
	if (props.contextmenu) {
		os.contextMenu(props.contextmenu, ev);
	}
}

function moveToTop(): void {
	main.style.zIndex = os.claimZIndex(props.front ? 'middle' : 'low').toString();
}

function getClickPos(evt: MouseEvent | TouchEvent): [number, number] {
	if (evt instanceof MouseEvent) {
		return [evt.clientX, evt.clientY];
	}
	return [evt.touches[0].clientX, evt.touches[0].clientY];
}

function onHeaderMousedown(evt: MouseEvent | TouchEvent): void {
	// Right-click ignored as it is likely to have attempted to open a context menu
	if (evt instanceof MouseEvent && evt.button === 2) return;

	if (!contains(main, document.activeElement)) main.focus();

	const position = main.getBoundingClientRect();

	const [clickX, clickY] = getClickPos(evt);
	const moveBaseX = clickX - position.left;
	const moveBaseY = clickY - position.top;
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = main.offsetWidth;
	const windowHeight = main.offsetHeight;

	// 動かした時
	const listener = (me: MouseEvent | TouchEvent): void => {
		const [x, y] = getClickPos(me);

		let moveLeft = x - moveBaseX;
		let moveTop = y - moveBaseY;

		// 下はみ出し
		if (moveTop + windowHeight > browserHeight) moveTop = browserHeight - windowHeight;

		// 左はみ出し
		if (moveLeft < 0) moveLeft = 0;

		// 上はみ出し
		if (moveTop < 0) moveTop = 0;

		// 右はみ出し
		if (moveLeft + windowWidth > browserWidth) moveLeft = browserWidth - windowWidth;

		main.style.left = moveLeft + 'px';
		main.style.top = moveTop + 'px';
	};

	if (evt instanceof MouseEvent) {
		addMouseListener((me: MouseEvent) => listener(me));
	} else {
		addTouchListener((me: TouchEvent) => listener(me));
	}
}

// 上ハンドル掴み時
function onTopHandleMousedown(evt: MouseEvent): void {
	const base = evt.clientY;
	const height = parseInt(getComputedStyle(main, '').height, 10);
	const top = parseInt(getComputedStyle(main, '').top, 10);

	// 動かした時
	addMouseListener((me: MouseEvent) => {
		const move = me.clientY - base;
		if (top + move > 0) {
			if (height + -move > minHeight) {
				applyTransformHeight(height + -move);
				applyTransformTop(top + move);
			} else { // 最小の高さより小さくなろうとした時
				applyTransformHeight(minHeight);
				applyTransformTop(top + (height - minHeight));
			}
		} else { // 上のはみ出し時
			applyTransformHeight(top + height);
			applyTransformTop(0);
		}
	});
}

// 右ハンドル掴み時
function onRightHandleMousedown(evt: MouseEvent): void {
	const base = evt.clientX;
	const width = parseInt(getComputedStyle(main, '').width, 10);
	const left = parseInt(getComputedStyle(main, '').left, 10);
	const browserWidth = window.innerWidth;

	// 動かした時
	addMouseListener((me: MouseEvent) => {
		const move = me.clientX - base;
		if (left + width + move < browserWidth) {
			if (width + move > minWidth) {
				applyTransformWidth(width + move);
			} else { // 最小の幅より小さくなろうとした時
				applyTransformWidth(minWidth);
			}
		} else { // 右のはみ出し時
			applyTransformWidth(browserWidth - left);
		}
	});
}

// 下ハンドル掴み時
function onBottomHandleMousedown(evt: MouseEvent): void {
	const base = evt.clientY;
	const height = parseInt(getComputedStyle(main, '').height, 10);
	const top = parseInt(getComputedStyle(main, '').top, 10);
	const browserHeight = window.innerHeight;

	// 動かした時
	addMouseListener((me: MouseEvent) => {
		const move = me.clientY - base;
		if (top + height + move < browserHeight) {
			if (height + move > minHeight) {
				applyTransformHeight(height + move);
			} else { // 最小の高さより小さくなろうとした時
				applyTransformHeight(minHeight);
			}
		} else { // 下のはみ出し時
			applyTransformHeight(browserHeight - top);
		}
	});
}

// 左ハンドル掴み時
function onLeftHandleMousedown(evt: MouseEvent): void {
	const base = evt.clientX;
	const width = parseInt(getComputedStyle(main, '').width, 10);
	const left = parseInt(getComputedStyle(main, '').left, 10);

	// 動かした時
	addMouseListener((me: MouseEvent) => {
		const move = me.clientX - base;
		if (left + move > 0) {
			if (width + -move > minWidth) {
				applyTransformWidth(width + -move);
				applyTransformLeft(left + move);
			} else { // 最小の幅より小さくなろうとした時
				applyTransformWidth(minWidth);
				applyTransformLeft(left + (width - minWidth));
			}
		} else { // 左のはみ出し時
			applyTransformWidth(left + width);
			applyTransformLeft(0);
		}
	});
}

// 左上ハンドル掴み時
function onTopLeftHandleMousedown(evt: MouseEvent): void {
	onTopHandleMousedown(evt);
	onLeftHandleMousedown(evt);
}

// 右上ハンドル掴み時
function onTopRightHandleMousedown(evt: MouseEvent): void {
	onTopHandleMousedown(evt);
	onRightHandleMousedown(evt);
}

// 右下ハンドル掴み時
function onBottomRightHandleMousedown(evt: MouseEvent): void {
	onBottomHandleMousedown(evt);
	onRightHandleMousedown(evt);
}

// 左下ハンドル掴み時
function onBottomLeftHandleMousedown(evt: MouseEvent): void {
	onBottomHandleMousedown(evt);
	onLeftHandleMousedown(evt);
}

// 高さを適用
function applyTransformHeight(height: number): void {
	main.style.height = Math.min(height, window.innerHeight) + 'px';
}

// 幅を適用
function applyTransformWidth(width: number): void {
	main.style.width = Math.min(width, window.innerWidth) + 'px';
}

// Y座標を適用
function applyTransformTop(top: number): void {
	main.style.top = top + 'px';
}

// X座標を適用
function applyTransformLeft(left: number): void {
	main.style.left = left + 'px';
}

function onBrowserResize(): void {
	const position = main.getBoundingClientRect();
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = main.offsetWidth;
	const windowHeight = main.offsetHeight;
	if (position.left < 0) main.style.left = '0'; // 左はみ出し
	if (position.top + windowHeight > browserHeight) main.style.top = (browserHeight - windowHeight) + 'px'; // 下はみ出し
	if (position.left + windowWidth > browserWidth) main.style.left = (browserWidth - windowWidth) + 'px'; // 右はみ出し
	if (position.top < 0) main.style.top = '0'; // 上はみ出し
}
</script>

<style lang="scss" scoped>
.window-enter-active, .window-leave-active {
	transition: opacity 0.2s, transform 0.2s !important;
}
.window-enter-from, .window-leave-to {
	pointer-events: none;
	opacity: 0;
	transform: scale(0.9);
}

.ebkgocck {
	position: fixed;
	top: 0;
	left: 0;
	background: var(--panel);

	> .body {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		contain: content;
		width: 100%;
		height: 100%;
		border-radius: var(--radius);

		> .header {
			--height: 45px;

			&.mini {
				--height: 38px;
			}

			display: flex;
			position: relative;
			z-index: 1;
			flex-shrink: 0;
			user-select: none;
			height: var(--height);
			font-size: 95%;
			font-weight: bold;

			> .left, > .right {
				> .button {
					height: var(--height);
					width: var(--height);

					&:hover {
						color: var(--fgHighlighted);
					}

					&.highlighted {
						color: var(--accent);
					}
				}
			}

			> .left {
				margin-right: 16px;
			}

			> .right {
				min-width: 16px;
			}

			> .title {
				flex: 1;
				position: relative;
				line-height: var(--height);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				cursor: move;
			}
		}

		> .body {
			flex: 1;
			overflow: auto;
		}
	}

	> .handle {
		$size: 8px;

		position: absolute;

		&.top {
			top: -($size);
			left: 0;
			width: 100%;
			height: $size;
			cursor: ns-resize;
		}

		&.right {
			top: 0;
			right: -($size);
			width: $size;
			height: 100%;
			cursor: ew-resize;
		}

		&.bottom {
			bottom: -($size);
			left: 0;
			width: 100%;
			height: $size;
			cursor: ns-resize;
		}

		&.left {
			top: 0;
			left: -($size);
			width: $size;
			height: 100%;
			cursor: ew-resize;
		}

		&.top-left {
			top: -($size);
			left: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nwse-resize;
		}

		&.top-right {
			top: -($size);
			right: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nesw-resize;
		}

		&.bottom-right {
			bottom: -($size);
			right: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nwse-resize;
		}

		&.bottom-left {
			bottom: -($size);
			left: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nesw-resize;
		}
	}
}
</style>
