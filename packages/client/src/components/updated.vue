<template>
<MkModal ref="modal" :z-priority="'middle'" @click="modal?.close()" @closed="emit('closed')">
	<div class="ewlycnyt">
		<div class="title"><MkSparkle>{{ i18n.ts.misskeyUpdated }}</MkSparkle></div>
		<div class="version">✨{{ version }}🚀</div>
		<MkButton full @click="whatIsNew">{{ i18n.ts.whatIsNew }}</MkButton>
		<MkButton class="gotIt" primary full @click="modal?.close()">{{ i18n.ts.gotIt }}</MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkModal from '@/components/ui/modal.vue';
import MkButton from '@/components/ui/button.vue';
import MkSparkle from '@/components/sparkle.vue';
import { version } from '@/config';
import { i18n } from '@/i18n';

const modal = ref<InstanceType<typeof MkModal>>();
const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const whatIsNew = (): void => {
	modal.value?.close();
	window.open('https://akkoma.dev/FoundKeyGang/FoundKey/src/branch/main/CHANGELOG.md', '_blank');
};
</script>

<style lang="scss" scoped>
.ewlycnyt {
	position: relative;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);

	> .title {
		font-weight: bold;
	}

	> .version {
		margin: 1em 0;
	}

	> .gotIt {
		margin: 8px 0 0 0;
	}
}
</style>
