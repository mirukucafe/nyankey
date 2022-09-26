<template>
<div v-if="$i">
	<div v-if="state == 'waiting'" class="waiting _section">
		<div class="_content">
			<MkLoading/>
		</div>
	</div>
	<div v-if="state == 'denied'" class="denied _section">
		<div class="_content">
			<p>{{ i18n.ts._auth.denied }}</p>
		</div>
	</div>
	<div v-else-if="state == 'accepted'" class="accepted _section">
		<div class="_content">
			<p v-if="callback">{{ i18n.ts._auth.callback }}<MkEllipsis/></p>
			<p v-else>{{ i18n.ts._auth.pleaseGoBack }}</p>
		</div>
	</div>
	<div v-else class="_section">
		<div v-if="name" class="_title">{{ i18n.t('_auth.shareAccess', { name: name }) }}</div>
		<div v-else class="_title">{{ i18n.ts._auth.shareAccessAsk }}</div>
		<div class="_content">
			<p>{{ i18n.ts._auth.permissionAsk }}</p>
			<ul>
				<li v-for="p in permission" :key="p">{{ i18n.t(`_permissions.${p}`) }}</li>
			</ul>
		</div>
		<div class="_footer">
			<MkButton inline @click="deny">{{ i18n.ts.cancel }}</MkButton>
			<MkButton inline primary @click="accept">{{ i18n.ts.accept }}</MkButton>
		</div>
	</div>
</div>
<div v-else class="signin">
	<MkSignin @login="onLogin"/>
</div>
</template>

<script lang="ts" setup>
import MkSignin from '@/components/signin.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { login } from '@/account';
import { appendQuery, query } from '@/scripts/url';
import { i18n } from '@/i18n';

const props = defineProps<{
	session: string;
	callback: string;
	name: string;
	icon: string;
	permission: string;
}>();

let state: 'waiting' | 'denied' | 'accepted' | 'initial' = $ref('initial');

async function accept(): Promise<void> {
	state = 'waiting';
	await os.api('miauth/gen-token', {
		session: props.session,
		name: props.name,
		iconUrl: props.icon,
		permission: props.permission,
	});

	state = 'accepted';
	if (props.callback) {
		location.href = appendQuery(props.callback, query({
			session: props.session,
		}));
	}
}

function deny(): void {
	state = 'denied';
}

function onLogin(res): void {
	login(res.i);
}
</script>
