<template>
<div>
	<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
		<MkA v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _gap">
			<b>{{ item.name }}</b>
			<div v-if="item.description" class="description">{{ item.description }}</div>
		</MkA>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';

const props = defineProps<{
	user: Record<string, any>;
}>();

const pagination = {
	endpoint: 'users/clips',
	limit: 20,
	params: {
		userId: props.user.id,
	},
};

let list = $ref();

watch(props.user, () => list.reload());
</script>

<style lang="scss" scoped>

</style>
