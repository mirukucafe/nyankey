<template>
<div v-if="$i">
	<div v-if="state == 'waiting'" class="waiting _section">
		<div class="_content">
			<MkLoading/>
		</div>
	</div>
	<div v-if="state == 'denied'" class="denied _section">
		<div class="_content">
			<p>{{ $ts._auth.denied }}</p>
		</div>
	</div>
	<div v-else-if="state == 'accepted'" class="accepted _section">
		<div class="_content">
			<p v-if="callback">{{ $ts._auth.callback }}<MkEllipsis/></p>
			<p v-else>{{ $ts._auth.pleaseGoBack }}</p>
		</div>
	</div>
	<div v-else class="_section">
		<div v-if="name" class="_title">{{ $t('_auth.shareAccess', { name: name }) }}</div>
		<div v-else class="_title">{{ $ts._auth.shareAccessAsk }}</div>
		<div class="_content">
			<p>{{ $ts._auth.permissionAsk }}</p>
			<ul>
				<li v-for="p in permission" :key="p">{{ $t(`_permissions.${p}`) }}</li>
			</ul>
		</div>
		<div class="_footer">
			<MkButton inline @click="deny">{{ $ts.cancel }}</MkButton>
			<MkButton inline primary @click="accept">{{ $ts.accept }}</MkButton>
		</div>
	</div>
</div>
<div v-else class="signin">
	<MkSignin @login="onLogin"/>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkSignin from '@/components/signin.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { login } from '@/account';
import { appendQuery, query } from '@/scripts/url';

const props = defineProps<{
	session: string;
	callback: string;
	name: string;
	icon: string;
	permission: string;
}>();

let state: 'waiting' | 'denied' | 'accepted' | 'initial' = $ref('initial');

async function accept() {
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

function deny() {
	state = 'denied';
}

function onLogin(res) {
	login(res.i);
}
</script>
