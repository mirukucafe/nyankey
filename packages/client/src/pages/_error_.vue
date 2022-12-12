<template>
<MkLoading v-if="!loaded"/>
<transition :name="$store.state.animation ? 'zoom' : ''" appear>
	<div v-show="loaded" class="mjndxjch">
		<img :src="instance.images.error" class="_ghost"/>
		<p><b><i class="fas fa-exclamation-triangle"></i> {{ i18n.ts.pageLoadError }}</b></p>
		<p v-if="version === instance.version">{{ i18n.ts.pageLoadErrorDescription }}</p>
		<p v-else-if="serverIsDead">{{ i18n.ts.serverIsDead }}</p>
		<template v-else>
			<p>{{ i18n.ts.newVersionOfClientAvailable }}</p>
			<p>{{ i18n.ts.youShouldUpgradeClient }}</p>
			<MkButton class="button primary" @click="reload">{{ i18n.ts.reload }}</MkButton>
		</template>
		<p><MkA to="/docs/general/troubleshooting" class="_link">{{ i18n.ts.troubleshooting }}</MkA></p>
		<p v-if="error" class="error">ERROR: {{ error }}</p>
	</div>
</transition>
</template>

<script lang="ts" setup>
import * as foundkey from 'foundkey-js';
import MkButton from '@/components/ui/button.vue';
import { version } from '@/config';
import { instance } from '@/instance';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

withDefaults(defineProps<{
	error?: Error | undefined;
}>(), {
	error: undefined,
});

let loaded = $ref(false);
let serverIsDead = $ref(false);

// just checking whether the server is alive or dead
os.api('ping').then(() => {
	loaded = true;
	serverIsDead = false;
}, () => {
	loaded = true;
	serverIsDead = true;
});

function reload(): void {
	unisonReload();
}

definePageMetadata({
	title: i18n.ts.error,
	icon: 'fas fa-exclamation-triangle',
});
</script>

<style lang="scss" scoped>
.mjndxjch {
	padding: 32px;
	text-align: center;

	> p {
		margin: 0 0 12px 0;
	}

	> .button {
		margin: 8px auto;
	}

	> img {
		vertical-align: bottom;
		height: 128px;
		margin-bottom: 24px;
		border-radius: 16px;
	}

	> .error {
		opacity: 0.7;
	}
}
</style>
