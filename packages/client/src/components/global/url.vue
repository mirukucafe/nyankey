<template>
<component
	:is="self ? 'MkA' : 'a'" ref="el" class="ieqqeuvs _link" :[attr]="self ? url.slice(local.length) : url" :rel="rel" :target="target"
	@contextmenu.stop="() => {}"
>
	<template v-if="!self">
		<span class="schema">{{ schema }}//</span>
		<span class="hostname">{{ hostname }}</span>
		<span v-if="port != ''" class="port">:{{ port }}</span>
	</template>
	<template v-if="pathname === '/' && self">
		<span class="self">{{ hostname }}</span>
	</template>
	<span v-if="pathname != ''" class="pathname">{{ self ? pathname.slice(1) : pathname }}</span>
	<span class="query">{{ query }}</span>
	<span class="hash">{{ hash }}</span>
	<i v-if="target === '_blank'" class="fas fa-external-link-square-alt icon"></i>
</component>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import { toUnicode as decodePunycode } from 'punycode/';
import { url as local } from '@/config';
import * as os from '@/os';
import { useTooltip } from '@/scripts/use-tooltip';
import { safeURIDecode } from '@/scripts/safe-uri-decode';

const props = withDefaults(defineProps<{
	url: string;
	rel?: string | null;
}>(), {
	rel: null,
});

const self = props.url.startsWith(local);
const url = new URL(props.url);
let el: HTMLElement | null = $ref(null);

let schema = $ref(url.protocol);
let hostname = $ref(decodePunycode(url.hostname));
let port = $ref(url.port);
let pathname = $ref(safeURIDecode(url.pathname));
let query = $ref(safeURIDecode(url.search));
let hash = $ref(safeURIDecode(url.hash));
let attr = $ref(self ? 'to' : 'href');
let target = $ref(self ? null : '_blank');

useTooltip($$(el), (showing) => {
	os.popup(defineAsyncComponent(() => import('@/components/url-preview-popup.vue')), {
		showing,
		url: props.url,
		source: el,
	}, {}, 'closed');
});
</script>

<style lang="scss" scoped>
.ieqqeuvs {
	word-break: break-all;

	> .icon {
		padding-left: 2px;
		font-size: .9em;
	}

	> .self {
		font-weight: bold;
	}

	> .schema {
		opacity: 0.5;
	}

	> .hostname {
		font-weight: bold;
	}

	> .pathname {
		opacity: 0.8;
	}

	> .query {
		opacity: 0.5;
	}

	> .hash {
		font-style: italic;
	}
}
</style>
