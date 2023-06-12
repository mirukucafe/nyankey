<template>
<div class="wavesurfer">
	<div ref="display" class="wavesurfer-display"></div>
	<div class="controls">
		<button class="play" @click="playPause()">
			<i class="fas fa-pause" v-if="playing"></i>
			<i class="fas fa-play" v-else></i>
		</button>
		<button class="stop" @click="stop()">
			<i class="fas fa-stop"></i>
		</button>
		<input class="progress" type="range" min="0" :max="duration" step="0.1" v-model="position" @input="player.seekTo(position / duration)" @mousedown="initSeek()" @mouseup="endSeek()" />
		<span>
			{{ formatTime(duration) }}
		</span>
		<input class="volume" type="range" min="0" max="1" step="0.1" v-model="volume" @input="player.setVolume(volume)" />
		<a class="download" :href="src.url" target="_blank">
			<i class="fas fa-download"></i>
		</a>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import * as foundkey from 'foundkey-js';
import WaveSurfer from 'wavesurfer.js';
import Cursor from 'wavesurfer.js/dist/plugin/wavesurfer.cursor';

const props = defineProps<{
	src: foundkey.entities.DriveFile
}>();

let playing = $ref(false);
let position = $ref(0);
let volume = $ref(1);
let isSeeking = $ref(false);
let duration = $ref(1);
let display = $ref<HTMLDivElement>(null);
let player = $ref(null);

const theme = JSON.parse(localStorage.theme);

onMounted(() => {
	player = WaveSurfer.create({
		container: display,
		barGap: 1,
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

	player.load(props.src.url);

	player.on('ready', () => {
		volume = player.getVolume();
		duration = player.getDuration();
	});

	player.on('finish', () => {
		playing = player.isPlaying();
	});

	player.on('audioprocess', () => {
		if (!isSeeking) {
			position = player.getCurrentTime();
		}
	});
});

function formatTime(value) {
	let hour = 0;
	if ((value / 60) > 0) {
		hour = Math.floor(value / 3600);
	}
	let min = Math.floor((value / 60) - hour * 60);
	let sec = Math.floor(value - (min * 60));
	if (sec < 10) {
		sec = '0' + sec;
	}
	if (min < 10) {
		min = '0' + min;
	}
	if (hour > 0) {
		return hour + ':' + min + ':' + sec;
	}
	return min + ':' + sec;
}

function playPause() {
	player.playPause();
	playing = player.isPlaying();
}

function stop() {
	player.stop();
	playing = player.isPlaying();
}

function initSeek() {
	isSeeking = true;
	if (playing) {
		player.playPause();
	}
}

function endSeek() {
	isSeeking = false;
	if (playing) {
		player.playPause();
	}
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
