<template>
<MkContainer :show-header="widgetProps.showHeader" :naked="widgetProps.transparent" :class="$style.root" :data-transparent="widgetProps.transparent ? true : null" class="mkw-photos">
	<template #header><i class="fas fa-camera"></i>{{ i18n.ts._widgets.photos }}</template>

	<div class="">
		<MkLoading v-if="fetching"/>
		<div v-else :class="$style.stream">
			<div
				v-for="(image, i) in images" :key="i"
				:class="$style.img"
				:style="`background-image: url(${thumbnail(image)})`"
			></div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue';
import { DriveFile } from 'foundkey-js/built/entities';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from './widget';
import { GetFormResultType } from '@/scripts/form';
import { stream } from '@/stream';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import * as os from '@/os';
import MkContainer from '@/components/ui/container.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

const name = 'photos';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
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

const connection = stream.useChannel('main');
let images: DriveFile[] = $ref([]);
let fetching = $ref(true);

const onDriveFileCreated = (file: DriveFile): void => {
	if (/^image\/.+$/.test(file.type)) {
		images.unshift(file);
		if (images.length > 9) images.pop();
	}
};

const thumbnail = (image: DriveFile): string => {
	return defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(image.thumbnailUrl)
		: image.thumbnailUrl;
};

os.api('drive/stream', {
	type: 'image/*',
	limit: 9,
}).then(res => {
	images = res;
	fetching = false;
});

connection.on('driveFileCreated', onDriveFileCreated);
onUnmounted(() => {
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root[data-transparent] {
	.stream {
		padding: 0;
	}

	.img {
		border: solid 4px transparent;
		border-radius: 8px;
	}
}

.stream {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	padding: 8px;

	.img {
		flex: 1 1 33%;
		width: 33%;
		height: 80px;
		box-sizing: border-box;
		background-position: center center;
		background-size: cover;
		background-clip: content-box;
		border: solid 2px transparent;
		border-radius: 4px;
	}
}
</style>
