<template>
<MkModal ref="modal" @click="done(true)" @closed="emit('closed')">
	<div class="container">
		<div class="fullwidth top-caption">
			<div class="mk-dialog">
				<header>
					<Mfm v-if="title" class="title" :text="title"/>
					<span class="text-count" :class="{ over: remainingLength < 0 }">{{ remainingLength }}</span>
				</header>
				<textarea v-model="inputValue" autofocus :placeholder="input.placeholder" @keydown="onInputKeydown"></textarea>
				<div v-if="(showOkButton || showCancelButton)" class="buttons">
					<MkButton inline primary :disabled="remainingLength < 0" @click="ok">{{ i18n.ts.ok }}</MkButton>
					<MkButton inline @click="cancel">{{ i18n.ts.cancel }}</MkButton>
				</div>
			</div>
		</div>
		<div class="hdrwpsaf fullwidth">
			<header>{{ file.name }}</header>
			<img v-if="file.type.startsWith('image/')" :src="file.url" @click="modal.close()"/>
			<video v-else-if="file.type.startsWith('video/')" controls>
				<source :src="file.url" :type="file.type">
			</video>
			<audio v-else-if="file.type.startsWith('audio/')" controls>
				<source :src="file.url" :type="file.type">
			</audio>
			<a v-else :href="file.url">{{ file.url }}</a>
			<footer>
				<span>{{ file.type }}</span>
				<span>{{ bytes(file.size) }}</span>
				<span v-if="file.properties?.width">{{ number(file.properties.width) }}px × {{ number(file.properties.height) }}px</span>
			</footer>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, computed } from 'vue';
import { length } from 'stringz';
import * as foundkey from 'foundkey-js';
import MkModal from '@/components/ui/modal.vue';
import MkButton from '@/components/ui/button.vue';
import bytes from '@/filters/bytes';
import number from '@/filters/number';
import { i18n } from '@/i18n';

type Input = {
	placeholder?: string;
	default?: any;
};

const props = withDefaults(defineProps<{
	file: foundkey.entities.DriveFile;
	title?: string;
	input: Input;
	showOkButton: boolean;
	showCancelButton: boolean;
	cancelableByBgClick: boolean;
}>(), {
	title: undefined,
	showOkButton: true,
	showCancelButton: true,
	cancelableByBgClick: true,
});

const emit = defineEmits<{
	(ev: 'done', v: { canceled: boolean, result?: string }): void,
	(ev: 'closed'): void,
}>();

let inputValue: string | undefined = $ref(props.input.default ?? undefined);
let modal = $ref<InstanceType<typeof MkModal>>();

function done(canceled: boolean, result?: string): void {
	emit('done', { canceled, result });
	modal.close();
}

function ok(): void {
	if (!props.showOkButton) return;

	const result = inputValue;
	done(false, result);
}

function cancel(): void {
	done(true);
}

function onKeydown(evt: KeyboardEvent): void {
	if (evt.key === 'Escape') {
		cancel();
	}
}

function onInputKeydown(evt: KeyboardEvent): void {
	if (evt.key === 'Enter') {
		if (evt.ctrlKey) {
			evt.preventDefault();
			evt.stopPropagation();
			ok();
		}
	}
}

const remainingLength = computed((): number => {
	if (typeof inputValue !== 'string') return 2048;
	return 2048 - length(inputValue);
});

onMounted(() => {
	document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onKeydown);
});
</script>

<style lang="scss" scoped>
.container {
	display: flex;
	width: 100%;
	height: 100%;
	flex-direction: row;
	overflow: scroll;
	position: fixed;
	left: 0;
	top: 0;
}
@media (max-width: 850px) {
	.container {
		flex-direction: column;
	}
	.top-caption {
		padding-bottom: 8px;
	}
}
.fullwidth {
	width: 100%;
	margin: auto;
}
.mk-dialog {
	position: relative;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
	margin: auto;

	> header {
		margin: 0 0 8px 0;
		position: relative;

		> .title {
			font-weight: bold;
			font-size: 20px;
		}

		> .text-count {
			opacity: 0.7;
			position: absolute;
			right: 0;
		}
	}

	> .buttons {
		margin-top: 16px;

		> * {
			margin: 0 8px;
		}
	}

	> textarea {
		display: block;
		box-sizing: border-box;
		padding: 0 24px;
		margin: 0;
		width: 100%;
		font-size: 16px;
		border: none;
		border-radius: 0;
		background: transparent;
		color: var(--fg);
		font-family: inherit;
		max-width: 100%;
		min-width: 100%;
		min-height: 90px;

		&:focus-visible {
			outline: none;
		}

		&:disabled {
			opacity: 0.5;
		}
	}
}
.hdrwpsaf {
	display: flex;
	flex-direction: column;
	height: 100%;

	> header,
	> footer {
		align-self: center;
		display: inline-block;
		padding: 6px 9px;
		font-size: 90%;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 6px;
		color: #fff;
	}

	> header {
		margin-bottom: 8px;
		opacity: 0.9;
	}

	> img {
		display: block;
		flex: 1;
		min-height: 0;
		object-fit: contain;
		width: 100%;
		cursor: zoom-out;
		image-orientation: from-image;
	}

	> footer {
		margin-top: 8px;
		opacity: 0.8;

		> span + span {
			margin-left: 0.5em;
			padding-left: 0.5em;
			border-left: solid 1px rgba(255, 255, 255, 0.5);
		}
	}
}
</style>
