<template>
<MkContainer :show-header="widgetProps.showHeader" :naked="widgetProps.transparent">
	<template #header><i class="fas fa-server"></i>{{ i18n.ts._widgets.serverMetric }}</template>
	<template #func><button class="_button" @click="toggleView()"><i class="fas fa-sort"></i></button></template>

	<div v-if="meta" class="mkw-serverMetric">
		<XCpuMemory v-if="widgetProps.view === 0" :connection="connection" :meta="meta"/>
		<XNet v-else-if="widgetProps.view === 1" :connection="connection" :meta="meta"/>
		<XCpu v-else-if="widgetProps.view === 2" :connection="connection" :meta="meta"/>
		<XMemory v-else-if="widgetProps.view === 3" :connection="connection" :meta="meta"/>
		<XDisk v-else-if="widgetProps.view === 4" :connection="connection" :meta="meta"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue';
import { ServerInfo } from 'foundkey-js/built/entities';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from '../widget';
import XCpuMemory from './cpu-mem.vue';
import XNet from './net.vue';
import XCpu from './cpu.vue';
import XMemory from './mem.vue';
import XDisk from './disk.vue';
import MkContainer from '@/components/ui/container.vue';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import { stream } from '@/stream';
import { i18n } from '@/i18n';

const name = 'serverMetric';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	view: {
		type: 'number' as const,
		default: 0,
		hidden: true,
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

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

let meta = $ref<ServerInfo | null>(null);

os.api('server-info', {}).then(res => {
	meta = res;
});

const toggleView = (): void => {
	if (widgetProps.view === 4) {
		widgetProps.view = 0;
	} else {
		widgetProps.view++;
	}
	save();
};

const connection = stream.useChannel('serverStats');
onUnmounted(() => {
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
