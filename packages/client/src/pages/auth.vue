<template>
<div v-if="$i">
	<MkLoading v-if="state == 'fetching'"/>
	<XForm
		v-else-if="state == 'waiting'"
		ref="form"
		class="form"
		:session="session"
		@denied="state = 'denied'"
		@accepted="accepted"
	/>
	<div v-else-if="state == 'denied'" class="denied">
		<h1>{{ i18n.ts._auth.denied }}</h1>
	</div>
	<div v-else-if="state == 'accepted'" class="accepted">
		<h1>{{ session.app.isAuthorized ? i18n.t('already-authorized') : i18n.ts.allowed }}</h1>
		<p v-if="session.app.callbackUrl">{{ i18n.ts._auth.callback }}<MkEllipsis/></p>
		<p v-if="!session.app.callbackUrl">{{ i18n.ts._auth.pleaseGoBack }}</p>
	</div>
	<div v-else-if="state == 'fetch-session-error'" class="error">
		<p>{{ i18n.ts.somethingHappened }}</p>
	</div>
</div>
<div v-else class="signin">
	<MkSignin @login="onLogin"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import XForm from './auth.form.vue';
import MkSignin from '@/components/signin.vue';
import * as os from '@/os';
import { login , $i } from '@/account';
import { i18n } from '@/i18n';

import { query, appendQuery } from '@/scripts/url';

const props = defineProps<{
	token: string;
}>();

let state: 'fetching' | 'waiting' | 'denied' | 'accepted' | 'fetch-session-error' = $ref('fetching');
let session = $ref(null);

onMounted(() => {
	if (!$i) return;

	// Fetch session
	os.api('auth/session/show', {
		token: props.token,
	}).then(fetchedSession => {
		session = fetchedSession;

		// 既に連携していた場合
		if (session.app.isAuthorized) {
			os.api('auth/accept', {
				token: session.token,
			}).then(() => {
				this.accepted();
			});
		} else {
			state = 'waiting';
		}
	}).catch(error => {
		state = 'fetch-session-error';
	});
});

function accepted() {
	state = 'accepted';
	if (session.app.callbackUrl) {
		location.href = appendQuery(session.app.callbackUrl, query({ token: session.token }));
	}
}

function onLogin(res) {
	login(res.i);
}
</script>
