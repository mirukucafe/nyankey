<template>
<div class="ddiqwdnk">
	<XWidgets class="widgets" :edit="editMode" :widgets="defaultStore.reactiveState.widgets.value.filter(w => w.place === place)" @add-widget="addWidget" @remove-widget="removeWidget" @update-widget="updateWidget" @update-widgets="updateWidgets" @exit="editMode = false"/>

	<button v-if="editMode" class="_textButton edit" style="font-size: 0.9em;" @click="editMode = false"><i class="fas fa-check"></i> {{ i18n.ts.editWidgetsExit }}</button>
	<button v-else class="_textButton edit" style="font-size: 0.9em;" @click="editMode = true"><i class="fas fa-pencil-alt"></i> {{ i18n.ts.editWidgets }}</button>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted } from 'vue';
import XWidgets from '@/components/widgets.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

const emit = defineEmits<{
	(ev: 'mounted'): void;
}>();

const props = withDefaults(defineProps<{
	place?: 'left' | null;
}>(), {
	place: null,
});

let editMode: boolean = $ref(false);

onMounted(() => {
	emit('mounted');
});

function addWidget(widget) {
	defaultStore.set('widgets', [{
		...widget,
		place: props.place,
	}, ...defaultStore.state.widgets]);
}

function removeWidget(widget) {
	defaultStore.set('widgets', defaultStore.state.widgets.filter(w => w.id !== widget.id));
}

function updateWidget({ id, data }) {
	defaultStore.set('widgets', defaultStore.state.widgets.map(w => w.id === id ? {
		...w,
		data,
	} : w));
}

function updateWidgets(widgets) {
	defaultStore.set('widgets', [
		...defaultStore.state.widgets.filter(w => w.place !== props.place),
		...widgets,
	]);
}
</script>

<style lang="scss" scoped>
.ddiqwdnk {
	position: sticky;
	height: min-content;
	box-sizing: border-box;
	padding-bottom: 8px;

	> .widgets,
	> .a {
		width: 300px;
	}

	> .edit {
		display: block;
		margin: 16px auto;
	}
}
</style>
