<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="700">
		<div class="_formRoot">
			<div class="_formBlock">
				<FormInput v-model="endpoint" :datalist="endpoints" class="_formBlock" @update:modelValue="onEndpointChange()">
					<template #label>Endpoint</template>
				</FormInput>
				<FormTextarea v-model="body" class="_formBlock" code>
					<template #label>Params (JSON or JSON5)</template>
				</FormTextarea>
				<FormSwitch v-model="withCredential" class="_formBlock">
					With credential
				</FormSwitch>
				<MkButton class="_formBlock" primary :disabled="sending" @click="send">
					<template v-if="sending"><MkEllipsis/></template>
					<template v-else><i class="fas fa-paper-plane"></i> Send</template>
				</MkButton>
			</div>
			<div v-if="res" class="_formBlock">
				<FormTextarea v-model="res" code readonly tall>
					<template #label>Response</template>
				</FormTextarea>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import JSON5 from 'json5';
import { Endpoints } from 'foundkey-js';
import MkButton from '@/components/ui/button.vue';
import FormInput from '@/components/form/input.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSwitch from '@/components/form/switch.vue';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';

let body = $ref('{}');
let endpoint = $ref('');
let endpoints = $ref<any[]>([]);
let sending = $ref(false);
let res = $ref('');
let withCredential = $ref(true);

os.api('endpoints').then(endpointResponse => {
	endpoints = endpointResponse;
});

function send(): void {
	sending = true;
	const requestBody = JSON5.parse(body);
	os.api(endpoint as keyof Endpoints, requestBody, requestBody.i || (withCredential ? undefined : null)).then(resp => {
		sending = false;
		res = JSON5.stringify(resp, null, 2);
	}, err => {
		sending = false;
		res = JSON5.stringify(err, null, 2);
	});
}

function onEndpointChange(): void {
	if (!endpoints.includes(endpoint)) return;

	os.api('endpoint', { endpoint }, withCredential ? undefined : null).then(resp => {
		const endpointBody = {};
		for (const p of resp.params) {
			endpointBody[p.name] =
				p.type === 'String' ? '' :
				p.type === 'Number' ? 0 :
				p.type === 'Boolean' ? false :
				p.type === 'Array' ? [] :
				p.type === 'Object' ? {} :
				null;
		}
		body = JSON5.stringify(endpointBody, null, 2);
	});
}

definePageMetadata({
	title: 'API console',
	icon: 'fas fa-terminal',
});
</script>
