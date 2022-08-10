<template>
<div class="mk-group-page">
	<transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
		<div v-if="group" class="_section">
			<div class="_content" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
				<MkButton inline @click="invite()">{{ i18n.ts.invite }}</MkButton>
				<MkButton inline @click="renameGroup()">{{ i18n.ts.rename }}</MkButton>
				<MkButton inline @click="transfer()">{{ i18n.ts.transfer }}</MkButton>
				<MkButton inline @click="deleteGroup()">{{ i18n.ts.delete }}</MkButton>
			</div>
		</div>
	</transition>

	<transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
		<div v-if="group" class="_section members _gap">
			<div class="_title">{{ i18n.ts.members }}</div>
			<div class="_content">
				<div class="users">
					<div v-for="user in users" :key="user.id" class="user _panel">
						<MkAvatar :user="user" class="avatar" :show-indicator="true"/>
						<div class="body">
							<MkUserName :user="user" class="name"/>
							<MkAcct :user="user" class="acct"/>
						</div>
						<div class="action">
							<button class="_button" @click="removeUser(user)"><i class="fas fa-times"></i></button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</transition>
</div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { mainRouter } from '@/router';

const props = defineProps<{
	groupId: string;
}>();

let group = $ref(null);
let users = $ref([]);

watch(props.groupId, fetch, { immediate: true });

definePageMetadata(computed(() => group ? {
	title: group.name,
	icon: 'fas fa-users',
} : null));

function fetch(): void {
	os.api('users/groups/show', { groupId: props.groupId })
	.then(fetchedGroup => {
		group = fetchedGroup;
		os.api('users/show', { userIds: group.userIds })
		.then(fetchedUsers => users = fetchedUsers);
	});
}

function invite(): void {
	os.selectUser().then(user => {
		os.apiWithDialog('users/groups/invite', {
			groupId: group.id,
			userId: user.id,
		});
	});
}

function removeUser(user): void {
	os.api('users/groups/pull', {
		groupId: group.id,
		userId: user.id,
	}).then(() => {
		users = users.filter(x => x.id !== user.id);
	});
}

async function renameGroup(): void {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.groupName,
		default: group.name,
	});
	if (canceled) return;

	await os.api('users/groups/update', {
		groupId: group.id,
		name,
	});

	group.name = name;
}

function transfer(): void {
	os.selectUser().then(user => {
		os.apiWithDialog('users/groups/transfer', {
			groupId: group.id,
			userId: user.id,
		});
	});
}

async function deleteGroup() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: group.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('users/groups/delete', {
		groupId: group.id,
	});
	mainRouter.push('/my/groups');
}
</script>

<style lang="scss" scoped>
.mk-group-page {
	> .members {
		> ._content {
			> .users {
				> .user {
					display: flex;
					align-items: center;
					padding: 16px;

					> .avatar {
						width: 50px;
						height: 50px;
					}

					> .body {
						flex: 1;
						padding: 8px;

						> .name {
							display: block;
							font-weight: bold;
						}

						> .acct {
							opacity: 0.5;
						}
					}
				}
			}
		}
	}
}
</style>
