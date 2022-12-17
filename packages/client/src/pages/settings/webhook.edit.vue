<template>
<div class="_formRoot">
	<FormInput v-model="name" class="_formBlock">
		<template #label>Name</template>
	</FormInput>

	<FormInput v-model="url" type="url" class="_formBlock">
		<template #label>URL</template>
	</FormInput>

	<FormInput v-model="secret" class="_formBlock">
		<template #prefix><i class="fas fa-lock"></i></template>
		<template #label>Secret</template>
	</FormInput>

	<FormSection>
		<template #label>Events</template>

		<FormSwitch v-model="event_follow" class="_formBlock">Follow</FormSwitch>
		<FormSwitch v-model="event_followed" class="_formBlock">Followed</FormSwitch>
		<FormSwitch v-model="event_note" class="_formBlock">Note</FormSwitch>
		<FormSwitch v-model="event_reply" class="_formBlock">Reply</FormSwitch>
		<FormSwitch v-model="event_renote" class="_formBlock">Renote</FormSwitch>
		<FormSwitch v-model="event_reaction" class="_formBlock">Reaction</FormSwitch>
		<FormSwitch v-model="event_mention" class="_formBlock">Mention</FormSwitch>
	</FormSection>

	<FormSwitch v-model="active" class="_formBlock">Active</FormSwitch>

	<div class="_formBlock" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
		<MkButton primary inline @click="save"><i class="fas fa-check"></i> {{ i18n.ts.save }}</MkButton>
		<MkButton danger inline @click="del"><i class="fas fa-trash-alt"></i> {{ i18n.ts.delete }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/input.vue';
import FormSection from '@/components/form/section.vue';
import FormSwitch from '@/components/form/switch.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { useRouter } from '@/router';

const router = useRouter();

const webhook = await os.api('i/webhooks/show', {
	webhookId: new URLSearchParams(window.location.search).get('id'),
});

let name = $ref(webhook.name);
let url = $ref(webhook.url);
let secret = $ref(webhook.secret);
let active = $ref(webhook.active);

let event_follow = $ref(webhook.on.includes('follow'));
let event_followed = $ref(webhook.on.includes('followed'));
let event_note = $ref(webhook.on.includes('note'));
let event_reply = $ref(webhook.on.includes('reply'));
let event_renote = $ref(webhook.on.includes('renote'));
let event_reaction = $ref(webhook.on.includes('reaction'));
let event_mention = $ref(webhook.on.includes('mention'));

async function save(): Promise<void> {
	const events = [];
	if (event_follow) events.push('follow');
	if (event_followed) events.push('followed');
	if (event_note) events.push('note');
	if (event_reply) events.push('reply');
	if (event_renote) events.push('renote');
	if (event_reaction) events.push('reaction');
	if (event_mention) events.push('mention');

	await os.apiWithDialog('i/webhooks/update', {
		webhookId: webhook.id,
		name,
		url,
		secret,
		on: events,
		active,
	});

	router.push('/settings/webhook');
}

async function del(): Promise<void> {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	});
	if (canceled) return;
	await os.apiWithDialog('i/webhooks/delete', {
		webhookId: webhook.id,
	});
	router.push('/settings/webhook');
}

definePageMetadata({
	title: 'Edit webhook',
	icon: 'fas fa-bolt',
});
</script>
