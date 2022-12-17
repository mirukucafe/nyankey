<template>
<div class="driuhtrh">
	<div class="query">
		<FormInput v-model="q" class="" :placeholder="i18n.ts.search">
			<template #prefix><i class="fas fa-search"></i></template>
		</FormInput>
	</div>

	<MkFolder v-if="searchEmojis" class="emojis">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<div class="zuvgdzyt">
			<XEmoji v-for="emoji in searchEmojis" :key="emoji.name" class="emoji" :emoji="emoji"/>
		</div>
	</MkFolder>
	
	<MkFolder v-for="category in emojiCategories" :key="category" class="emojis">
		<template #header>{{ category || i18n.ts.other }}</template>
		<div class="zuvgdzyt">
			<XEmoji v-for="emoji in instance.emojis.filter(e => e.category === category)" :key="emoji.name" class="emoji" :emoji="emoji"/>
		</div>
	</MkFolder>
</div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import XEmoji from './emojis.emoji.vue';
import FormInput from '@/components/form/input.vue';
import MkFolder from '@/components/ui/folder.vue';
import { i18n } from '@/i18n';
import { emojiCategories, instance } from '@/instance';

let q: string = $ref('');
let searchEmojis: null | Record<string, any>[] = $ref(null);

function search(): void {
	if (q === '') {
		searchEmojis = null;
	} else {
		searchEmojis = instance.emojis.filter(emoji => emoji.name.includes(q) || emoji.aliases.includes(q));
	}
}
watch($$(q), search);
</script>

<style lang="scss" scoped>
.driuhtrh {
	background: var(--bg);

	> .query {
		background: var(--bg);
		padding: 16px;

		> .tags {
			> .tag {
				display: inline-block;
				margin: 8px 8px 0 0;
				padding: 4px 8px;
				font-size: 0.9em;
				background: var(--accentedBg);
				border-radius: 5px;

				&.active {
					background: var(--accent);
					color: var(--fgOnAccent);
				}
			}
		}
	}

	> .emojis {
		--x-padding: 0 16px;

		.zuvgdzyt {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: 0 var(--margin) var(--margin) var(--margin);
		}
	}
}
</style>
