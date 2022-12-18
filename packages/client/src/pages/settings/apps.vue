<template>
<div class="_formRoot">
	<FormPagination ref="list" :pagination="pagination">
		<template #empty>
			<div class="_fullinfo">
				<img :src="instance.images.info" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</template>
		<template #default="{items}">
			<div v-for="token in items" :key="token.id" class="_panel bfomjevm">
				<img v-if="token.iconUrl" class="icon" :src="token.iconUrl" alt=""/>
				<div class="body">
					<button class="_button" @click="revoke(token)"><i class="fas fa-trash-alt"></i></button>
					<table>
						<tr>
							<th>{{ i18n.ts.name }}:</th>
							<td>{{ token.name }}</td>
						</tr>
						<tr>
							<th>{{ i18n.ts.description }}:</th>
							<td>{{ token.description }}</td>
						</tr>
						<tr>
							<th>{{ i18n.ts.installedDate }}:</th>
							<td><MkTime :time="token.createdAt"/></td>
						</tr>
						<tr>
							<th>{{ i18n.ts.lastUsedDate }}:</th>
							<td><MkTime :time="token.lastUsedAt"/></td>
						</tr>
					</table>
					<details>
						<summary>{{ i18n.ts.details }}</summary>
						<ul>
							<li v-for="p in token.permission" :key="p">{{ i18n.t(`_permissions.${p}`) }}</li>
						</ul>
					</details>
				</div>
			</div>
		</template>
	</FormPagination>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import FormPagination from '@/components/ui/pagination.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { instance } from '@/instance';

const list = ref<any>(null);

const pagination = {
	endpoint: 'i/apps' as const,
	limit: 100,
	params: {
		sort: '+lastUsedAt',
	},
};

function revoke(token) {
	os.api('i/revoke-token', { tokenId: token.id }).then(() => {
		list.value.reload();
	});
}

definePageMetadata({
	title: i18n.ts.installedApps,
	icon: 'fas fa-plug',
});
</script>

<style lang="scss" scoped>
.bfomjevm {
	display: flex;
	padding: 16px;

	> .icon {
		display: block;
		flex-shrink: 0;
		margin: 0 12px 0 0;
		width: 50px;
		height: 50px;
		border-radius: 8px;
	}

	> .body {
		width: 100%;
		position: relative;

		button {
			position: absolute;
			top: 0;
			right: 0;
		}
		th {
			text-align: right;
		}
		td {
			text-align: left;
		}
	}
}
</style>
