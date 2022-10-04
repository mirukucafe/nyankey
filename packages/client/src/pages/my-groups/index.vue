<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div v-if="tab === 'owned'" class="_content">
			<MkPagination v-slot="{items}" ref="owned" :pagination="ownedPagination">
				<div v-for="group in items" :key="group.id" class="_card">
					<div class="_title"><MkA :to="`/my/groups/${ group.id }`" class="_link">{{ group.name }}</MkA></div>
					<div class="_content"><MkAvatars :user-ids="group.userIds"/></div>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'joined'" class="_content">
			<MkPagination v-slot="{items}" ref="joined" :pagination="joinedPagination">
				<div v-for="group in items" :key="group.id" class="_card">
					<div class="_title">{{ group.name }}</div>
					<div class="_content"><MkAvatars :user-ids="group.userIds"/></div>
					<div class="_footer">
						<MkButton danger @click="leave(group)">{{ i18n.ts.leaveGroup }}</MkButton>
					</div>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'invites'" class="_content">
			<MkPagination v-slot="{items}" ref="invitations" :pagination="invitationPagination">
				<div v-for="invitation in items" :key="invitation.id" class="_card">
					<div class="_title">{{ invitation.group.name }}</div>
					<div class="_content"><MkAvatars :user-ids="invitation.group.userIds"/></div>
					<div class="_footer">
						<MkButton primary inline @click="acceptInvite(invitation)"><i class="fas fa-check"></i> {{ i18n.ts.accept }}</MkButton>
						<MkButton primary inline @click="rejectInvite(invitation)"><i class="fas fa-ban"></i> {{ i18n.ts.reject }}</MkButton>
					</div>
				</div>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import MkContainer from '@/components/ui/container.vue';
import MkAvatars from '@/components/avatars.vue';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const headerActions = [{
	icon: 'fas fa-plus',
	text: i18n.ts.createGroup,
	handler: create,
}];

const headerTabs = [{
	key: 'owned',
	title: i18n.ts.ownedGroups,
	icon: 'fas fa-user-tie',
}, {
	key: 'joined',
	title: i18n.ts.joinedGroups,
	icon: 'fas fa-id-badge',
}, {
	key: 'invites',
	title: i18n.ts.invites,
	icon: 'fas fa-envelope-open-text',
}];

let tab: 'owned' | 'joined' | 'invites' = $ref('owned');
let owned = $ref<MkPagination>();
let joined = $ref<MkPagination>();
let invitations = $ref<MkPagination>();

const ownedPagination = {
	endpoint: 'users/groups/owned' as const,
	limit: 10,
};
const joinedPagination = {
	endpoint: 'users/groups/joined' as const,
	limit: 10,
};
const invitationPagination = {
	endpoint: 'i/user-group-invites' as const,
	limit: 10,
};

definePageMetadata(computed(() => ({
	title: i18n.ts.groups,
	icon: 'fas fa-users',
	bg: 'var(--bg)',
})));

async function create(): void {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.groupName,
	});
	if (canceled) return;
	await os.api('users/groups/create', { name });
	owned.reload();
	os.success();
}

function acceptInvite(invitation): void {
	os.api('users/groups/invitations/accept', {
		invitationId: invitation.id,
	}).then(() => {
		invitations.reload();
		joined.reload();
		os.success();
	});
}

function rejectInvite(invitation): void {
	os.api('users/groups/invitations/reject', {
		invitationId: invitation.id,
	}).then(() => {
		invitations.reload();
	});
}

async function leave(group): void {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('leaveGroupConfirm', { name: group.name }),
	});
	if (canceled) return;
	os.apiWithDialog('users/groups/leave', {
		groupId: group.id,
	}).then(() => {
		joined.reload();
	});
}
</script>

<style lang="scss" scoped>
</style>
