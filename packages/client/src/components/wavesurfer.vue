<template>
<div class="wavesurfer">
	<div ref="display" class="wavesurfer-display"></div>
	<div class="controls">
		<button class="play" @click="playPause()">
			<i class="fas fa-pause" v-if="playing"></i>
			<i class="fas fa-play" v-if="!playing"></i>
		</button>
		<button class="stop" @click="stop()">
			<i class="fas fa-stop"></i>
		</button>
		<input class="progress" type="range" min="0" :max="duration" step="0.1" v-model="position" @change="player.seekTo(position / duration)" @mousedown="isSeeking = true" @mouseup="isSeeking = false" />
		<span>
			{{ formatTime(duration) }}
		</span>
		<input class="volume" type="range" min="0" max="1" step="0.1" v-model="volume" @change="player.setVolume(volume)" />
		<a class="download" :href="src" target="_blank">
			<i class="fas fa-download"></i>
		</a>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import * as foundkey from 'foundkey-js';
import WaveSurfer from 'wavesurfer.js';
import Cursor from 'wavesurfer.js/dist/plugin/wavesurfer.cursor';

const props = defineProps<{
	src: foundkey.entities.DriveFile
}>();

let playing = ref(false);
let position = ref(0);
let volume = ref(1);
let isSeeking = ref(false);
let duration = ref(1);
let display = ref<HTMLDivElement>(null);
let player = ref(null);

const theme = JSON.parse(localStorage.theme);

onMounted(() => {
	player.value = WaveSurfer.create({
		container: display.value,
		barGab: 1,
		barWidth: 2,
		barRadius: 2,
		backgroundColor: theme.panel,
		progressColor: theme.accent,
		waveColor: theme.accentedBg,
		cursorColor: theme.indicator,
		backend: 'MediaElement',
		plugins: [
			Cursor.create({
				showTime: true,
				opacity: 1,
				color: theme.indicator
			})
		]
	});

	player.value.load(props.src.url);

	player.value.on('ready', () => {
		volume.value = player.value.getVolume();
		duration.value = player.value.getDuration();
	});

	player.value.on('finish', () => {
		playing.value = player.value.isPlaying();
	});

	player.value.on('audioprocess', () => {
		if (!isSeeking.value) {
			position.value = player.value.getCurrentTime();
		}
	});
});

function formatTime(value) {
	let min = Math.floor(value / 60);
	let sec = Math.floor(value - (min * 60));
	if (sec < 10) {
		sec = '0' + sec;
	}
	if (min < 10) {
		sec = '0' + min;
	}
	return min + ':' + sec;
}

function playPause() {
	player.value.playPause();
	playing.value = player.value.isPlaying();
}

function stop() {
	player.value.stop();
	playing.value = player.value.isPlaying();
}

</script>

<style lang="scss" scoped>

.wavesurfer {
	position: relative;
	display: flex;
	flex-direction: column;

	.wavesurfer-display {
		border: 2px solid var(--bg);
		border-bottom: 0px;
	}

	.controls {
		display: flex;
		width: 100%;
		background-color: var(--bg);

		> * {
			padding: 4px 8px;
		}

		> button, a {
			border: none;
			background-color: transparent;
			color: var(--accent);
			cursor: pointer;

			&:hover {
				background-color: var(--fg);
			}
		}

		> input[type=range] {
			height: 21px;
			-webkit-appearance: none;
			width: 90px;
			padding: 0;
			margin: 4px 8px;
			overflow-x: hidden;

			&:focus {
				outline: none;

				&::-webkit-slider-runnable-track {
					background: var(--bg);
				}

				&::-ms-fill-lower, &::-ms-fill-upper {
					background: var(--bg);
				}
			}

			&::-webkit-slider-runnable-track {
				width: 100%;
				height: 100%;
				cursor: pointer;
				border-radius: 0;
				animate: 0.2s;
				background: var(--bg);
				border: 1px solid var(--fg);
				overflow-x: hidden;
			}

			&::-webkit-slider-thumb {
				border: none;
				height: 100%;
				width: 14px;
				border-radius: 0;
				background: var(--accentLighten);
				cursor: pointer;
				-webkit-appearance: none;
				box-shadow: calc(-100vw - 14px) 0 0 100vw var(--accent);
				clip-path: polygon(1px 0, 100% 0, 100% 100%, 1px 100%, 1px calc(50% + 10.5px), -100vw calc(50% + 10.5px), -100vw calc(50% - 10.5px), 0 calc(50% - 10.5px));
				z-index: 1;
			}

			&::-moz-range-track {
				width: 100%;
				height: 100%;
				pointer: pointer;
				border-radius: 0;
				animate: 0.2s;
				background: var(--bg);
				border: 1px solid var(--fg);
			}

			&::-moz-range-progress {
				cursor: pointer;
				height: 100%;
				background: var(--accent);
			}

			&::-moz-range-thumb {
				border: none;
				height: 100%;
				border-radius: 0;
				width: 14px;
				background: var(--accentLighten);
				cursor: pointer;
			}

			&::-ms-track {
				width: 100%;
				height: 100%;
				cursor: pointer;
				border-radius: 0;
				animate: 0.2s;
				background: transparent;
				border-color: transparent;
				color: transparent;
			}

			&::-ms-fill-lower {
				background: var(--accent);
				border: 1px solid var(--fg);
				border-radius: 0;
			}

			&::-ms-fill-upper {
				background: var(--bg);
				border: 1px solid var(--fg);
				border-radius: 0;
			}

			&::-ms-thumb {
				margin-top: 1px;
				border: none;
				height: 100%;
				width: 14px;
				border-radius: 0;
				background: var(--accentLighten);
				cursor: pointer;
			}

			&.progress {
				flex-grow: 1;
				min-width: 0;
			}
		}
	}
}

</style>
