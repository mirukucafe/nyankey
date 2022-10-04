<template>
<KeepAlive :max="defaultStore.state.numberOfPageCache">
	<Suspense>
		<component :is="currentPageComponent" :key="key" v-bind="Object.fromEntries(currentPageProps)"/>

		<template #fallback>
			Loading...
		</template>
	</Suspense>
</KeepAlive>
</template>

<script lang="ts" setup>
import { inject, onUnmounted } from 'vue';
import { Router } from '@/nirax';
import { defaultStore } from '@/store';

const props = defineProps<{
	router?: Router;
}>();

const router = props.router ?? inject('router');

if (router == null) {
	throw new Error('no router provided');
}

let currentPageComponent = $shallowRef(router.getCurrentComponent());
let currentPageProps = $ref(router.getCurrentProps());
let key = $ref(router.getCurrentKey());

function onChange({ route, props: newProps, key: newKey }): void {
	currentPageComponent = route.component;
	currentPageProps = newProps;
	key = newKey;
}

router.addListener('change', onChange);

onUnmounted(() => {
	router.removeListener('change', onChange);
});
</script>
