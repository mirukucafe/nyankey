<template>
<time :title="absolute" :datetime="_time.toISOString()">
	<template v-if="mode === 'relative'">{{ relative }}</template>
	<template v-else-if="mode === 'absolute'">{{ absolute }}</template>
	<template v-else-if="mode === 'detail'">{{ absolute }} ({{ relative }})</template>
</time>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue';
import { i18n } from '@/i18n';
import { lang } from '@/config';

const props = withDefaults(defineProps<{
	time: Date | string;
	format?: 'both' | 'date' | 'time';
	mode?: 'relative' | 'absolute' | 'detail';
	utc?: boolean;
}>(), {
	format: 'both',
	mode: 'relative',
	utc: false,
});

const _time = typeof props.time === 'string' ? new Date(props.time) : props.time;
const absolute = ((): string => {
	const options = props.utc ? { timeZone: 'UTC' } : {};
	switch (props.format) {
		case 'date': return _time.toLocaleDateString(lang ?? 'en-US', options);
		case 'time': return _time.toLocaleTimeString(lang ?? 'en-US', options);
		default: return _time.toLocaleString(lang ?? 'en-US', options);
	}
})();

let now = $ref(new Date());
const relative = $computed(() => {
	const ago = (now.getTime() - _time.getTime()) / 1000/*ms*/;

	if (ago >= 31536000) {
		return i18n.t('_ago.yearsAgo', { n: Math.round(ago / 31536000).toString() });
	} else if (ago >= 2592000) {
		return i18n.t('_ago.monthsAgo', { n: Math.round(ago / 2592000).toString() });
	} else if (ago >= 604800) {
		return i18n.t('_ago.weeksAgo', { n: Math.round(ago / 604800).toString() });
	} else if (ago >= 86400) {
		return i18n.t('_ago.daysAgo', { n: Math.round(ago / 86400).toString() });
	}

	// if the format is 'date', the relative date precision is no more than days ago
	if (props.format !== 'date') {
		if (ago >= 3600) {
			return i18n.t('_ago.hoursAgo', { n: Math.round(ago / 3600).toString() });
		} else if (ago >= 60) {
			return i18n.t('_ago.minutesAgo', { n: (~~(ago / 60)).toString() });
		} else if (ago >= 10) {
			return i18n.t('_ago.secondsAgo', { n: (~~(ago % 60)).toString() });
		}
	}

	if (ago >= -5) {
		if (props.format === 'date') {
			// this is also the catch-all for the formats with hour/minute/second precision
			return i18n.ts.today;
		} else {
			return i18n.ts._ago.justNow;
		}
	}
	return i18n.ts._ago.future;
});

function tick(): void {
	// TODO: パフォーマンス向上のため、このコンポーネントが画面内に表示されている場合のみ更新する
	now = new Date();

	tickId = window.setTimeout(() => {
		window.requestAnimationFrame(tick);
	}, 10000);
}

let tickId: number;

if (props.mode === 'relative' || props.mode === 'detail') {
	tickId = window.requestAnimationFrame(tick);

	onUnmounted(() => {
		window.cancelAnimationFrame(tickId);
	});
}
</script>
