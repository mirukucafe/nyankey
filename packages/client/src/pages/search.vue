<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="800">
		<MkFolder>
			<template #header>{{ i18n.ts.search }}</template>
			<FormInput v-model="query" :autofocus="true" class="input" tabindex="1" @keydown="keydown">
				<template #prefix><i class="fas fa-magnifying-glass"></i></template>
				<template v-if="tab === 'users'" #label>{{ i18n.ts.username }}</template>
				<template v-if="tab === 'all'" #caption>Try entering a URL or user handle!</template>
			</FormInput>
			<template v-if="tab === 'notes'">
				<FormSelect v-model="author" class="input">
					<template #label>{{ i18n.ts.author }}</template>
					<option value="all">{{ i18n.ts.all }}</option>
					<option value="self">{{ i18n.ts.you }}</option>
					<option value="user">{{ i18n.ts.user }}</option>
					<option value="local">{{ i18n.ts.local }}</option>
					<option value="host">{{ i18n.ts.instance }}</option>
				</FormSelect>
				<MkButton v-if="author === 'user'" @click="selectUser" full class="input">
					<template v-if="user == null">{{ i18n.ts.selectUser }}</template>
					<template v-else>
						<MkAvatar :user="user" class="avatar"/>
						<MkAcct :user="user"/>
					</template>
				</MkButton>
				<FormInput v-if="author === 'host'" v-model="host" class="input">
					<template #prefix>@</template>
					<template #label>{{ i18n.ts.host }}</template>
				</FormInput>
			</template>
			<template v-if="tab === 'users'">
				<FormSelect v-model="origin" class="input">
					<template #label>{{ i18n.ts.instance }}</template>
					<option value="combined">{{ i18n.ts.all }}</option>
					<option value="local">{{ i18n.ts.local }}</option>
					<option value="remote">{{ i18n.ts.remote }}</option>
				</FormSelect>
			</template>
			<MkButton @click="search()" primary :disabled="!canSearch" class="input">
				<i class="fas fa-magnifying-glass"></i> {{ i18n.ts.search }}
			</MkButton>
		</MkFolder>
		<MkFolder v-if="tab === 'all' || tab === 'users'">
			<template #header>{{ i18n.ts.users }}</template>
			<XUserList v-if="userPagination" :pagination="userPagination"/>
		</MkFolder>
		<MkFolder v-if="tab === 'all' || tab === 'notes'">
			<template #header>{{ i18n.ts.notes }}</template>
			<XNotes v-if="notePagination" :pagination="notePagination"/>
		</MkFolder>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, nextTick, watch } from 'vue';
import XNotes from '@/components/notes.vue';
import XUserList from '@/components/user-list.vue';
import MkButton from '@/components/ui/button.vue';
import FormInput from '@/components/form/input.vue';
import FormSelect from '@/components/form/select.vue';
import MkFolder from '@/components/ui/folder.vue';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';

const headerTabs = [{
	key: 'all',
	title: i18n.ts.all,
}, {
	key: 'notes',
	title: i18n.ts.notes,
}, {
	key: 'users',
	title: i18n.ts.users,
}];

let tab: 'all' | 'notes' | 'users' = $ref('all');
let query: string = $ref('');
let author: 'all' | 'self' | 'user' | 'local' | 'host' = $ref('all');
let user = $ref(null);
let host: string = $ref('');
let origin: 'combined' | 'local' | 'remote' = $ref('combined');

let notePagination = $ref(null);
let userPagination = $ref(null);

watch($$(tab), () => {
	userPagination = null;
	notePagination = null;
});

let canSearch = $computed(() =>
	query !== ''
	&&
	(
		tab !== 'notes'
		||
		(
			author === 'all'
			|| author === 'self'
			|| author === 'local'
			|| author === 'host' && host !== ''
			|| author === 'user' && user != null
		)
	)
);

function selectUser() {
    os.selectUser().then(selectedUser => user = selectedUser);
}

async function search(): void {
	userPagination = null;
	notePagination = null;

	switch (tab) {
		case 'all': {
			query = query.trim();
			// process special query strings
			if (query.startsWith('@') && !query.includes(' ')) {
				mainRouter.push('/' + query);
			} else if (query.startsWith('#')) {
				mainRouter.push('/tags/' + encodeURIComponent(query.slice(1)));
			} else if (query.startsWith('https://')) {
				const promise = os.api('ap/show', {
					uri: query,
				});

				os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

				const res = await promise;

				if (res.type === 'User') {
					mainRouter.push(`/@${res.object.username}@${res.object.host}`);
				} else if (res.type === 'Note') {
					mainRouter.push(`/notes/${res.object.id}`);
				}
			} else {
				nextTick(() => {
					notePagination = {
						endpoint: 'notes/search' as const,
						limit: 10,
						params: { query },
					};
					origin = 'combined';
					userPagination = {
						endpoint: 'users/search' as const,
						limit: 4,
						params: {
							query,
							origin,
						},
					};
				});
			}
			break;
		}
		case 'notes': {
			const params = { query };
			switch (author) {
				case 'self':
					params.userId = $i.id;
					break;
				case 'user':
					params.userId = user.id;
					break;
				case 'local':
					params.host = null;
					break;
				case 'host':
					params.host = host;
					break;
			}
			nextTick(() => {
				notePagination = {
					endpoint: 'notes/search' as const,
					limit: 10,
					params,
				};
			});
			break;
		}
		case 'users': {
			nextTick(() => {
				userPagination = {
					endpoint: 'users/search' as const,
					limit: 10,
					params: {
						query,
						origin,
					},
				};
			});
			break;
		}
	}
}

function keydown(evt: KeyboardEvent): void {
	if (evt.key === 'Enter' && canSearch) {
		evt.preventDefault();
		evt.stopPropagation();
		search();
	}
}

definePageMetadata(computed(() => ({
	title: i18n.ts.search,
	icon: 'fas fa-search',
})));
</script>

<style lang="scss" scoped>
.input {
	margin-top: 16px;
}
</style>
