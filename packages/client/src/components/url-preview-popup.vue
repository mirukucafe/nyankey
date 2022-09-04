<template>
<div class="fgmtyycl" :style="{ zIndex, top: top + 'px', left: left + 'px' }">
	<transition :name="$store.state.animation ? 'zoom' : ''" @after-leave="emit('closed')">
		<MkUrlPreview v-if="showing" class="_popup _shadow" :url="url"/>
	</transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import MkUrlPreview from '@/components/url-preview.vue';
import * as os from '@/os';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const props = defineProps<{
	url: string;
	source: HTMLElement;
	showing: boolean;
}>();

let top = $ref(0);
let left = $ref(0);
const zIndex = os.claimZIndex('middle');

onMounted((): void => {
	const rect = props.source.getBoundingClientRect();
	top = Math.max((rect.left + (props.source.offsetWidth / 2)) - (300 / 2), 6) + window.pageXOffset;
	left = rect.top + props.source.offsetHeight + window.pageYOffset;
});
</script>

<style lang="scss" scoped>
.fgmtyycl {
	position: absolute;
	width: 500px;
	max-width: calc(90vw - 12px);
	pointer-events: none;
}
</style>
