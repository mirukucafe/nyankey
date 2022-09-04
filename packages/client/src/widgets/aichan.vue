<template>
<MkContainer :naked="widgetProps.transparent" :show-header="false" class="mkw-aichan">
	<iframe ref="live2d" class="dedjhjmo" src="https://misskey-dev.github.io/mascot-web/?scale=1.5&y=1.1&eyeY=100"></iframe>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from './widget';
import { GetFormResultType } from '@/scripts/form';

const name = 'ai';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{
	widget?: Widget<WidgetProps>;
}>();
const emit = defineEmits<{
	(ev: 'updateProps', widgetProps: WidgetProps);
}>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const live2d: HTMLIFrameElement = $ref();

const onMousemove = (ev: MouseEvent): void => {
	const iframeRect = live2d.getBoundingClientRect();
	live2d.contentWindow?.postMessage({
		type: 'moveCursor',
		body: {
			x: ev.clientX - iframeRect.left,
			y: ev.clientY - iframeRect.top,
		},
	}, '*');
};

onMounted(() => {
	window.addEventListener('mousemove', onMousemove, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener('mousemove', onMousemove);
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.dedjhjmo {
	width: 100%;
	height: 350px;
	border: none;
	pointer-events: none;
}
</style>
