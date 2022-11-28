<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<div style="overflow: clip;">
		<MkSpacer :content-max="600" :margin-min="20">
			<div class="_formRoot znqjceqz">
				<div id="debug"></div>
				<div ref="containerEl" v-panel class="_formBlock about" :class="{ playing: easterEggEngine != null }">
					<img src="/client-assets/about-icon.png" alt="" class="icon" draggable="false" @load="iconLoaded" @click="gravity"/>
					<div class="misskey">FoundKey</div>
					<div class="version">v{{ version }}</div>
					<span v-for="emoji in easterEggEmojis" :key="emoji.id" class="emoji" :data-physics-x="emoji.left" :data-physics-y="emoji.top" :class="{ _physics_circle_: typeof emoji.emoji !== 'string' || !emoji.emoji.startsWith(':') }"><MkEmoji class="emoji" :emoji="emoji.emoji.toString()" :custom-emojis="$instance.emojis" :is-reaction="false" :normal="true" :no-style="true"/></span>
				</div>
				<div class="_formBlock" style="text-align: center;">
					{{ i18n.ts._aboutMisskey.about }}<br><a href="https://akkoma.dev/FoundKeyGang/FoundKey/src/branch/main/README.md" target="_blank" class="_link">{{ i18n.ts.learnMore }}</a>
				</div>
				<div class="_formBlock" style="text-align: center;">
					<MkButton primary rounded inline @click="iLoveFoundkey">I <Mfm text="$[jelly ❤]"/> #FoundKey</MkButton>
				</div>
				<FormSection>
					<div class="_formLinks">
						<FormLink to="https://akkoma.dev/FoundKeyGang/FoundKey" external>
							<template #icon><i class="fas fa-code"></i></template>
							{{ i18n.ts._aboutMisskey.source }}
							<template #suffix>Gitea</template>
						</FormLink>
						<FormLink to="https://translate.akkoma.dev/projects/foundkey/foundkey/" external>
							<template #icon><i class="fas fa-language"></i></template>
							{{ i18n.ts._aboutMisskey.translation }}
							<template #suffix>Weblate</template>
						</FormLink>
					</div>
				</FormSection>
				<FormSection>
					<template #caption><MkLink url="https://akkoma.dev/FoundKeyGang/FoundKey/activity">{{ i18n.ts._aboutMisskey.allContributors }}</MkLink></template>
				</FormSection>
			</div>
		</MkSpacer>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount } from 'vue';
import { version } from '@/config';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/ui/button.vue';
import MkLink from '@/components/link.vue';
import { physics } from '@/scripts/physics';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';

type EasterEggEngine = {
	stop: () => void;
}

let easterEggReady = false;
let easterEggEmojis = $ref<Record<string, string | number>[]>([]);
let easterEggEngine = $ref<EasterEggEngine | null>(null);
const containerEl = $ref<HTMLElement>();

function iconLoaded(): void {
	const emojis = defaultStore.state.reactions;
	const containerWidth = containerEl.offsetWidth;
	for (let i = 0; i < 32; i++) {
		easterEggEmojis.push({
			id: i.toString(),
			top: -(128 + (Math.random() * 256)),
			left: (Math.random() * containerWidth),
			emoji: emojis[Math.floor(Math.random() * emojis.length)],
		});
	}

	nextTick(() => {
		easterEggReady = true;
	});
}

function gravity(): void {
	if (!easterEggReady) return;
	easterEggReady = false;
	easterEggEngine = physics(containerEl);
}

function iLoveFoundkey(): void {
	os.post({
		initialText: 'I $[jelly ❤] #FoundKey',
		instant: true,
	});
}

onBeforeUnmount(() => {
	easterEggEngine?.stop();
});

definePageMetadata({
	title: i18n.ts.aboutMisskey,
	icon: null,
});
</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		text-align: center;
		padding: 16px;
		border-radius: var(--radius);

		&.playing {
			&, * {
				user-select: none;
			}

			* {
				will-change: transform;
			}

			> .emoji {
				visibility: visible;
			}
		}

		> .icon {
			display: block;
			width: 100px;
			margin: 0 auto;
			border-radius: 16px;
		}

		> .misskey {
			margin: 0.75em auto 0 auto;
			width: max-content;
		}

		> .version {
			margin: 0 auto;
			width: max-content;
			opacity: 0.5;
		}

		> .emoji {
			position: absolute;
			top: 0;
			left: 0;
			visibility: hidden;

			> .emoji {
				pointer-events: none;
				font-size: 24px;
				width: 24px;
			}
		}
	}
}
</style>
