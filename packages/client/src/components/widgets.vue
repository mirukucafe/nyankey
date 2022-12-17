<template>
<div class="vjoppmmu">
	<template v-if="edit">
		<header>
			<FormSelect v-model="widgetAdderSelected" style="margin-bottom: var(--margin)" class="mk-widget-select">
				<template #label>{{ i18n.ts.selectWidget }}</template>
				<option v-for="widget in widgetDefs" :key="widget" :value="widget">{{ i18n.t(`_widgets.${widget}`) }}</option>
			</FormSelect>
			<MkButton inline primary class="mk-widget-add" @click="addWidget"><i class="fas fa-plus"></i> {{ i18n.ts.add }}</MkButton>
			<MkButton inline @click="emit('exit')">{{ i18n.ts.close }}</MkButton>
		</header>
		<XDraggable
			v-model="widgets_"
			item-key="id"
			handle=".handle"
			animation="150"
		>
			<template #item="{element}">
				<div class="customize-container">
					<button class="config _button" @click.prevent.stop="configWidget(element.id)"><i class="fas fa-cog"></i></button>
					<button class="remove _button" @click.prevent.stop="removeWidget(element)"><i class="fas fa-times"></i></button>
					<div class="handle">
						<component :is="`mkw-${element.name}`" :ref="el => widgetRefs[element.id] = el" class="widget" :widget="element" @updateProps="updateWidget(element.id, $event)"/>
					</div>
				</div>
			</template>
		</XDraggable>
	</template>
	<component :is="`mkw-${widget.name}`" v-for="widget in widgets" v-else :key="widget.id" class="widget" :widget="widget" @updateProps="updateWidget(widget.id, $event)"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, reactive, ref, computed } from 'vue';
import { v4 as uuid } from 'uuid';
import FormSelect from '@/components/form/select.vue';
import MkButton from '@/components/ui/button.vue';
import { widgets as widgetDefs } from '@/widgets';
import { i18n } from '@/i18n';

const XDraggable = defineAsyncComponent(() => import('vuedraggable'));

type Widgets = any[];

const props = defineProps<{
	widgets: Widgets;
	edit: boolean;
}>();

const emit = defineEmits<{
	(ev: 'updateWidgets', v: Widgets): void;
	(ev: 'addWidget', v: { name: string; id: string; data: Record<string, any>; }): void;
	(ev: 'removeWidget', v: { name: string; id: string; }): void;
	(ev: 'updateWidget', v: { id: string; data: Record<string, any>; }): void;
	(ev: 'exit'): void;
}>();

const widgetRefs = reactive({});
const configWidget = (id: string) => {
	widgetRefs[id].configure();
};
const widgetAdderSelected = ref(null);
const addWidget = () => {
	if (widgetAdderSelected.value == null) return;

	emit('addWidget', {
		name: widgetAdderSelected.value,
		id: uuid(),
		data: {},
	});

	widgetAdderSelected.value = null;
};
const removeWidget = (widget) => {
	emit('removeWidget', widget);
};
const updateWidget = (id, data) => {
	emit('updateWidget', { id, data });
};
const widgets_ = computed({
	get: () => props.widgets,
	set: (value) => {
		emit('updateWidgets', value);
	},
});
</script>

<style lang="scss" scoped>
.vjoppmmu {
	> header {
		margin: 16px 0;

		> * {
			width: 100%;
			padding: 4px;
		}
	}

	> .widget, .customize-container {
		margin: var(--margin) 0;

		&:first-of-type {
			margin-top: 0;
		}
	}

	.customize-container {
		position: relative;
		cursor: move;

		> .config,
		> .remove {
			position: absolute;
			z-index: 10000;
			top: 8px;
			width: 32px;
			height: 32px;
			color: #fff;
			background: rgba(#000, 0.7);
			border-radius: 4px;
		}

		> .config {
			right: 8px + 8px + 32px;
		}

		> .remove {
			right: 8px;
		}

		> .handle {
			> .widget {
				pointer-events: none;
			}
		}
	}
}
</style>
