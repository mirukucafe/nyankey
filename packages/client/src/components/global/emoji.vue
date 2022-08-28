<template>
<img v-if="customEmoji" class="mk-emoji custom" :class="{ normal, noStyle }" :src="url" :alt="alt" :title="alt" decoding="async"/>
<img v-else-if="char && !useOsNativeEmojis" class="mk-emoji" :src="url" :alt="alt" :title="alt" decoding="async"/>
<span v-else-if="char && useOsNativeEmojis">{{ char }}</span>
<span v-else>{{ emoji }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { CustomEmoji } from 'foundkey-js/built/entities';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { char2filePath } from '@/scripts/twemoji-base';
import { defaultStore } from '@/store';
import { instance } from '@/instance';

const props = withDefaults(defineProps<{
	emoji: string;
	normal?: boolean;
	noStyle?: boolean;
	customEmojis?: CustomEmoji[];
	isReaction?: boolean;
}>(), {
	normal: false,
	noStyle: false,
	customEmojis: () => [] as CustomEmoji[],
	isReaction: false,
});

const isCustom = computed(() => props.emoji.startsWith(':'));
const char = computed(() => isCustom.value ? '' : props.emoji);
const useOsNativeEmojis = computed(() => defaultStore.state.useOsNativeEmojis && !props.isReaction);
const ce = computed(() => props.customEmojis.length > 0 ? props.customEmojis : instance.emojis);
const customEmoji = computed(() => isCustom.value ? ce.value.find(x => props.emoji === `:${x.name}:`) : null);
const url = computed(() => {
	if (char.value) {
		return char2filePath(char.value);
	} else if (customEmoji.value) {
		if (defaultStore.state.disableShowingAnimatedImages) {
			return getStaticImageUrl(customEmoji.value.url);
		} else {
			return customEmoji.value.url;
		} 
	} else {
		return '';
	}
});
const alt = computed(() => customEmoji.value ? `:${customEmoji.value.name}:` : char.value);
</script>

<style lang="scss" scoped>
.mk-emoji {
	height: 1.25em;
	vertical-align: -0.25em;

	&.custom {
		height: 2.5em;
		vertical-align: middle;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.2);
		}

		&.normal {
			height: 1.25em;
			vertical-align: -0.25em;

			&:hover {
				transform: none;
			}
		}
	}

	&.noStyle {
		height: auto !important;
	}
}
</style>
