<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :max-content="700">
		<div v-if="$i">
			<MkLoading v-if="state == 'fetching'"/>
			<XForm
				v-else-if="state == 'waiting'"
				ref="form"
				class="form"
				:session="session"
				:permission="permission"
				@denied="denied"
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
			<div v-else-if="state == 'oauth-error'" class="error">
				<p>{{ i18n.ts.oauthErrorGoBack }}</p>
			</div>
		</div>
		<div v-else class="signin">
			<MkSignin @login="onLogin"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import XForm from './auth.form.vue';
import MkSignin from '@/components/signin.vue';
import * as os from '@/os';
import { login , $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { query, appendQuery } from '@/scripts/url';

const props = defineProps<{
	token?: string;
}>();

let state: 'fetching' | 'waiting' | 'denied' | 'accepted' | 'fetch-session-error' | 'oauth-error' = $ref('fetching');
let session = $ref(null);
let permission: string[] = $ref([]);

// if this is an OAuth request, will contain the respective parameters
let oauth: { state: string | null, callback: string } | null = null;

onMounted(async () => {
	if (!$i) return;

	// detect whether this is actual OAuth or "legacy" auth
	const params = new URLSearchParams(location.search);
	if (params.get('response_type') === 'code') {
		// OAuth request detected!

		// if PKCE is used, check that it is a supported method
		// the default value for code_challenge_method if not supplied is 'plain', which is not supported.
		if (params.has('code_challenge') && params.get('code_challenge_method') !== 'S256') {
			if (params.has('redirect_uri')) {
				location.href = appendQuery(params.get('redirect_uri'), query({
					error: 'invalid_request',
					error_description: 'unsupported code_challenge_method, only "S256" is supported',
				}));
			} else {
				state = 'oauth-error';
			}
			return;
		}

		// as a kind of hack, we first have to start the session for the OAuth client
		const clientId = params.get('client_id');
		if (!clientId) {
			state = 'fetch-session-error';
			return;
		}

		session = await os.api('auth/session/generate', {
			clientId,
			// make the server check the redirect, if provided
			callbackUrl: params.get('redirect_uri') ?? undefined,
			pkceChallenge: params.get('code_challenge') ?? undefined,
		}).catch(e => {
			const response = {
				error: 'server_error',
				...(oauth.state ? { state: oauth.state } : {}),
			};
			// try to determine the cause of the error
			if (e.code === 'NO_SUCH_APP') {
				response.error = 'invalid_request';
				response.error_description = 'unknown client_id';
			} else if (e.message) {
				response.error_description = e.message;
			}

			if (params.has('redirect_uri')) {
				location.href = appendQuery(params.get('redirect_uri'), query(response));
			} else {
				state = 'oauth-error';
			}
		});

		oauth = {
			state: params.get('state'),
			callback: params.get('redirect_uri') ?? session.app.callbackUrl,
		};

		if (params.has('scope')) {
			// If there are specific permissions requested, they have to be a subset of the apps permissions.
			permission = params.get('scope')
				.split(' ')
				.filter(scope => session.app.permission.includes(scope));
		} else {
			// Default to all permissions of this app.
			permission = session.app.permission;
		}
	} else if (!props.token) {
		state = 'fetch-session-error';
	} else {
		session = await os.api('auth/session/show', {
			token: props.token,
		}).catch(() => {
			state = 'fetch-session-error';
		});
		permission = session?.app.permission ?? [];
	}

	// abort if an error occurred
	if (['fetch-session-error', 'oauth-error'].includes(state)) return;

	// check whether the user already authorized the app earlier
	if (session.app.isAuthorized) {
		// already authorized, move on through!
		os.api('auth/accept', {
			token: session.token,
			permission,
		}).then(() => {
			accepted();
		});
	} else {
		// user still has to give consent
		state = 'waiting';
	}
});

function accepted(): void {
	state = 'accepted';
	if (oauth) {
		// redirect with authorization token
		const params = {
			code: session.token,
			...(oauth.state ? { state: oauth.state } : {}),
		};

		location.href = appendQuery(oauth.callback, query(params));
	} else if (session.app.callbackUrl) {
		// do whatever the legacy auth did
		location.href = appendQuery(session.app.callbackUrl, query({ token: session.token }));
	}
}

function denied(): void {
	state = 'denied';
	if (oauth) {
		// redirect with error code
		const params = {
			error: 'access_denied',
			error_description: 'The user denied permission.',
			...(oauth.state ? { state: oauth.state } : {}),
		};

		location.href = appendQuery(oauth.callback, query(params));
	} else {
		// legacy auth didn't do anything in this case...
	}
}

function onLogin(res): void {
	login(res.i);
}

definePageMetadata({
	title: i18n.ts.appAuthorization,
	icon: 'fas fa-shield',
});
</script>
