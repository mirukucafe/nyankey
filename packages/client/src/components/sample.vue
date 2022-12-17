<template>
<div class="_card">
	<div class="_content">
		<FormInput v-model="text">
			<template #label>Text</template>
		</FormInput>
		<FormSwitch v-model="flag">
			<span>Switch is now {{ flag ? 'on' : 'off' }}</span>
		</FormSwitch>
		<div style="margin: 32px 0;">
			<FormRadio v-model="radio" value="misskey">Misskey</FormRadio>
			<FormRadio v-model="radio" value="mastodon">Mastodon</FormRadio>
			<FormRadio v-model="radio" value="pleroma">Pleroma</FormRadio>
		</div>
		<MkButton inline>This is</MkButton>
		<MkButton inline primary>the button</MkButton>
	</div>
	<div class="_content" style="pointer-events: none;">
		<Mfm :text="mfm"/>
	</div>
	<div class="_content">
		<MkButton inline primary @click="openMenu">Open menu</MkButton>
		<MkButton inline primary @click="openDialog">Open dialog</MkButton>
		<MkButton inline primary @click="openForm">Open form</MkButton>
		<MkButton inline primary @click="openDrive">Open drive</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkButton from '@/components/ui/button.vue';
import FormInput from '@/components/form/input.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormRadio from '@/components/form/radio.vue';
import * as os from '@/os';
import * as config from '@/config';
import { $i } from '@/account';

const text = ref('');
const flag = ref(true);
const radio = ref('misskey');
const mfm = ref(`Hello world! This is an @example mention. BTW you are @${$i ? $i.username : 'guest'}.\nAlso, here is ${config.url} and [example link](${config.url}). for more details, see https://example.com.\nAs you know #misskey is open-source software.`);

function openDialog(): void {
	os.alert({
		type: 'warning',
		title: 'Oh my Aichan',
		text: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
	});
}

function openForm(): void {
	os.form('Example form', {
		foo: {
			type: 'boolean',
			default: true,
			label: 'This is a boolean property',
		},
		bar: {
			type: 'number',
			default: 300,
			label: 'This is a number property',
		},
		baz: {
			type: 'string',
			default: 'Misskey makes you happy.',
			label: 'This is a string property',
		},
	});
}

function openDrive(): void {
	os.selectDriveFile(true);
}

function openMenu(ev): void {
	os.popupMenu([{
		type: 'label',
		text: 'Fruits',
	}, {
		text: 'Create some apples',
		action: (): void => {},
	}, {
		text: 'Read some oranges',
		action: (): void => {},
	}, {
		text: 'Update some melons',
		action: (): void => {},
	}, null, {
		text: 'Delete some bananas',
		danger: true,
		action: (): void => {},
	}], ev.currentTarget ?? ev.target);
}
</script>
