<template>
<transition :name="$store.state.animation ? 'fade' : ''" mode="out-in">
	<MkLoading v-if="fetching"/>

	<MkError v-else-if="error" @retry="init()"/>

	<div v-else-if="empty" key="_empty_" class="empty">
		<slot name="empty">
			<div class="_fullinfo">
				<img :src="instance.images.info" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</slot>
	</div>

	<div v-else ref="rootEl">
		<div v-show="pagination.reversed && more" key="_more_" class="cxiknjgy _gap">
			<MkButton v-if="!moreFetching" class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary @click="fetchMore(true)">
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
		<slot :items="items"></slot>
		<div v-show="!pagination.reversed && more" key="_more_" class="cxiknjgy _gap">
			<MkButton v-if="!moreFetching" v-appear="($store.state.enableInfiniteScroll && !disableAutoLoad) ? fetchMore : null" class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary @click="fetchMore()">
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
	</div>
</transition>
</template>

<script lang="ts" setup>
import { ComputedRef, isRef, onActivated, onDeactivated, watch } from 'vue';
import * as foundkey from 'foundkey-js';
import * as os from '@/os';
import { onScrollTop, isTopVisible, getScrollPosition, getScrollContainer } from '@/scripts/scroll';
import MkButton from '@/components/ui/button.vue';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

export type Paging<E extends keyof foundkey.Endpoints = keyof foundkey.Endpoints> = {
	endpoint: E;
	limit: number;
	params?: foundkey.Endpoints[E]['req'] | ComputedRef<foundkey.Endpoints[E]['req']>;

	/**
	 * When using non-pageable endpoints, such as the search API.
	 * (though it is slightly inconsistent to use such an API with this function)
	 */
	noPaging?: boolean;

	/**
	 * items Array contents in reverse order (newest first, last)
	 */
	reversed?: boolean;

	offsetMode?: boolean;
};

const SECOND_FETCH_LIMIT = 30;

const props = withDefaults(defineProps<{
	pagination: Paging;
	disableAutoLoad?: boolean;
	displayLimit?: number;
}>(), {
	displayLimit: 30,
});

const emit = defineEmits<{
	(ev: 'queue', count: number): void;
	(ev: 'loaded'): void;
	(ev: 'error'): void;
}>();

type Item = { id: string; [another: string]: unknown; };

let rootEl: HTMLElement | null = $ref(null);
let items: Item[] = $ref([]);
let queue: Item[] = $ref([]);
let offset: number = $ref(0);
let fetching: boolean = $ref(true);
let moreFetching: boolean = $ref(false);
let more: boolean = $ref(false);
let backed: boolean = $ref(false); // 遡り中か否か
let isBackTop: boolean = $ref(false);
const empty = $computed(() => items.length === 0);
let error: boolean = $ref(false);

const init = async (): Promise<void> => {
	queue = [];
	fetching = true;
	const params = props.pagination.params
		? isRef(props.pagination.params)
			? props.pagination.params.value as Record<string, any>
			: props.pagination.params
		: {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: props.pagination.noPaging ? (props.pagination.limit || 10) : (props.pagination.limit || 10) + 1,
	}).then((res: Item[]) => {
		if (!props.pagination.noPaging && (res.length > (props.pagination.limit || 10))) {
			res.pop();
			more = true;
		} else {
			more = false;
		}
		items = props.pagination.reversed ? [...res].reverse() : res;
		offset = res.length;
		error = false;
		fetching = false;
		emit('loaded');
	}).catch(() => {
		error = true;
		fetching = false;
		emit('error');
	});
};

const reload = (): void => {
	items = [];
	init();
};

const fetchMore = async (ahead?: boolean): Promise<void> => {
	if (!more || fetching || moreFetching || items.length === 0) return;
	moreFetching = true;
	if (!ahead) {
		backed = true;
	}
	const params = props.pagination.params
		? isRef(props.pagination.params)
			? props.pagination.params.value as Record<string, any>
			: props.pagination.params
		: {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: SECOND_FETCH_LIMIT + 1,
		...(props.pagination.offsetMode ? {
			offset,
		} : ahead ? (
			props.pagination.reversed ? {
				untilId: items[0].id,
			} : {
				sinceId: items[items.length - 1].id,
			}
		) : (
			props.pagination.reversed ? {
				sinceId: items[0].id,
			} : {
				untilId: items[items.length - 1].id,
			}
		)),
	}).then(res => {
		if (res.length > SECOND_FETCH_LIMIT) {
			res.pop();
			more = true;
		} else {
			more = false;
		}
		items = props.pagination.reversed ? [...res].reverse().concat(items) : items.concat(res);
		offset += res.length;
		moreFetching = false;
	}, () => {
		moreFetching = false;
	});
};

const prepend = (item: Item): void => {
	if (props.pagination.reversed) {
		if (rootEl) {
			const container = getScrollContainer(rootEl);
			if (container == null) {
				// TODO?
			} else {
				const pos = getScrollPosition(rootEl);
				const viewHeight = container.clientHeight;
				const height = container.scrollHeight;
				const isBottom = (pos + viewHeight > height - 32);
				// Discard old items if they overflow.
				if (isBottom) {
					while (items.length >= props.displayLimit) {
						items.shift();
					}
					more = true;
				}
			}
		}
		items.push(item);
		// TODO
	} else {
		// Only unshift is required for initial display.
		if (!rootEl) {
			items.unshift(item);
			return;
		}

		const isTop = isBackTop || (document.body.contains(rootEl) && isTopVisible(rootEl));

		if (isTop) {
			// Prepend the item
			items.unshift(item);

			// Discard old items if they overflow.
			while (items.length >= props.displayLimit) {
				items.pop();
			}
			more = true;
		} else {
			queue.push(item);
			onScrollTop(rootEl, () => {
				for (const queueItem of queue) {
					prepend(queueItem);
				}
				queue = [];
			});
		}
	}
};

const append = (item: Item): void => {
	items.push(item);
};

const removeItem = (finder: (item: Item) => boolean): void => {
	const i = items.findIndex(finder);
	items.splice(i, 1);
};

const updateItem = (id: Item['id'], replacer: (old: Item) => Item): void => {
	const i = items.findIndex(item => item.id === id);
	items[i] = replacer(items[i]);
};

if (props.pagination.params && isRef(props.pagination.params)) {
	watch(props.pagination.params, init, { deep: true });
}

watch($$(queue), (a, b) => {
	if (a.length !== 0 || b.length !== 0) emit('queue', queue.length);
}, { deep: true });

init();

onActivated(() => {
	isBackTop = false;
});

onDeactivated(() => {
	isBackTop = window.scrollY === 0;
});

defineExpose({
	items,
	queue,
	backed,
	reload,
	prepend,
	append,
	removeItem,
	updateItem,
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

.cxiknjgy {
	> .button {
		margin-left: auto;
		margin-right: auto;
	}
}
</style>
