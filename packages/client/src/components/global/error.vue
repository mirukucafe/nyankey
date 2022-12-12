<template>
<transition :name="defaultStore.state.animation ? 'zoom' : ''" appear>
	<div class="mjndxjcg">
		<img :src="instance.images.error" class="_ghost"/>
		<p><i class="fas fa-exclamation-triangle"></i> {{ i18n.ts.somethingHappened }}</p>
		<MkButton v-if="!final" class="button" @click="retry">{{ i18n.ts.retry }}</MkButton>
	</div>
</transition>
</template>

<script lang="ts" setup>
import MkButton from '@/components/ui/button.vue';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import { instance } from '@/instance';

const emit = defineEmits<{
	(ev: 'retry'): void;
}>();
const retry = emit.bind(null, 'retry');

defineProps<{
	// true if this operation can not be retried
	final?: boolean;
}>();
</script>

<style lang="scss" scoped>
.mjndxjcg {
	padding: 32px;
	text-align: center;

	> p {
		margin: 0 0 8px 0;
	}

	> .button {
		margin: 0 auto;
	}

	> img {
		vertical-align: bottom;
		height: 128px;
		margin-bottom: 16px;
		border-radius: 16px;
	}
}
</style>
