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
import { DAY, WEEK, MONTH, YEAR, HOUR, MINUTE, SECOND } from '@/const';

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
	const ago = now.getTime() - _time.getTime();

	if (ago >= YEAR) {
		return i18n.t('_ago.yearsAgo', { n: Math.round(ago / YEAR).toString() });
	} else if (ago >= MONTH) {
		return i18n.t('_ago.monthsAgo', { n: Math.round(ago / MONTH).toString() });
	} else if (ago >= WEEK) {
		return i18n.t('_ago.weeksAgo', { n: Math.round(ago / WEEK).toString() });
	} else if (ago >= DAY) {
		return i18n.t('_ago.daysAgo', { n: Math.round(ago / DAY).toString() });
	}

	// if the format is 'date', the relative date precision is no more than days ago
	if (props.format !== 'date') {
		if (ago >= HOUR) {
			return i18n.t('_ago.hoursAgo', { n: Math.round(ago / HOUR).toString() });
		} else if (ago >= MINUTE) {
			return i18n.t('_ago.minutesAgo', { n: Math.floor(ago / MINUTE).toString() });
		} else if (ago >= 10 * SECOND) {
			return i18n.t('_ago.secondsAgo', { n: Math.floor(ago / SECOND).toString() });
		}
	}

	if (ago >= -5 * SECOND) {
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
