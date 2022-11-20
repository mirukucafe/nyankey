<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :tabs="headerTabs"/></template>
	<div class="lznhrdub">
		<div v-if="tab === 'featured'">
			<XFeatured/>
		</div>
		<div v-else-if="tab === 'localUsers'">
			<XUsers origin="local"/>
		</div>
		<div v-else-if="tab === 'remoteUsers'">
			<XUsers origin="remote"/>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XFeatured from './explore.featured.vue';
import XUsers from './explore.users.vue';
import MkFolder from '@/components/ui/folder.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

let tab = $ref('featured');

const headerTabs = $computed(() => [{
	key: 'featured',
	icon: 'fas fa-bolt',
	title: i18n.ts.featured,
}, {
	key: 'localUsers',
	icon: 'fas fa-users',
	title: i18n.ts.users,
}, {
	key: 'remoteUsers',
	icon: 'fas fa-users',
	title: i18n.ts.remote,
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.explore,
	icon: 'fas fa-hashtag',
})));
</script>
