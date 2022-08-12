<template>
<transition :name="defaultStore.state.animation ? 'fade' : ''" mode="out-in">
	<div v-if="state == 'pending'">
		<MkLoading/>
	</div>
	<div v-else-if="state == 'resolved'">
		<slot :result="result"></slot>
	</div>
	<div v-else>
		<MkError @retry="process"/>
	</div>
</transition>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import { defaultStore } from '@/store';

const props = defineProps<{
	p: () => Promise<any>;
}>();

let state: 'pending' | 'resolved' | 'rejected' = $ref('pending');
let result = $ref(null);

const process = () => {
	// this might be a retry so reset the state
	state = 'pending';

	props.p().then((_result) => {
		result = _result;
		state = 'resolved';
	}, () => {
		state = 'rejected';
	});
};

watch(() => props.p, () => {
	process();
}, {
	immediate: true,
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.wszdbhzo {
	padding: 16px;
	text-align: center;

	> .retry {
		margin-top: 16px;
	}
}
</style>
