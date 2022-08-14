<template>
<XModalWindow
	ref="dialog"
	:width="450"
	:can-close="false"
	:with-ok-button="true"
	:ok-button-disabled="false"
	@click="cancel()"
	@ok="ok()"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header>
		{{ title }}
	</template>

	<MkSpacer :margin-min="20" :margin-max="32">
		<div class="xkpnjxcv _formRoot">
			<template v-for="item in Object.keys(form).filter(item => !form[item].hidden)">
				<FormInput v-if="form[item].type === 'number'" v-model="values[item]" type="number" :step="form[item].step || 1" class="_formBlock">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</FormInput>
				<FormInput v-else-if="form[item].type === 'string' && !form[item].multiline" v-model="values[item]" type="text" class="_formBlock">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</FormInput>
				<FormTextarea v-else-if="form[item].type === 'string' && form[item].multiline" v-model="values[item]" class="_formBlock">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</FormTextarea>
				<FormSwitch v-else-if="form[item].type === 'boolean'" v-model="values[item]" class="_formBlock">
					<span v-text="form[item].label || item"></span>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</FormSwitch>
				<FormSelect v-else-if="form[item].type === 'enum'" v-model="values[item]" class="_formBlock">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="blockItem in form[item].enum" :key="blockItem.value" :value="blockItem.value">{{ blockItem.label }}</option>
				</FormSelect>
				<FormRadios v-else-if="form[item].type === 'radio'" v-model="values[item]" class="_formBlock">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="blockItem in form[item].options" :key="blockItem.value" :value="blockItem.value">{{ blockItem.label }}</option>
				</FormRadios>
				<FormRange v-else-if="form[item].type === 'range'" v-model="values[item]" :min="form[item].min" :max="form[item].max" :step="form[item].step" :text-converter="form[item].textConverter" class="_formBlock">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</FormRange>
				<MkButton v-else-if="form[item].type === 'button'" class="_formBlock" @click="form[item].action($event, values)">
					<span v-text="form[item].content || item"></span>
				</MkButton>
			</template>
		</div>
	</MkSpacer>
</XModalWindow>
</template>

<script lang="ts" setup>
import FormInput from './form/input.vue';
import FormTextarea from './form/textarea.vue';
import FormSwitch from './form/switch.vue';
import FormSelect from './form/select.vue';
import FormRange from './form/range.vue';
import MkButton from './ui/button.vue';
import FormRadios from './form/radios.vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import { i18n } from '@/i18n';

let dialog = $ref<InstanceType<typeof XModalWindow>>();
let values: Record<string, any> = $ref({});

const props = defineProps<{
	title: string,
	form: Record<string, any>,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { result?: Record<string, any>, canceled?: boolean }): void,
	(ev: 'closed'): void
}>();

function ok(): void {
	emit('done', {
		result: values,
	});
	dialog.close();
}

function cancel(): void {
	emit('done', {
		canceled: true,
	});
	dialog.close();
}

for (const item in props.form) {
	values[item] = props.form[item].default ?? null;
}
</script>

<style lang="scss" scoped>
</style>
