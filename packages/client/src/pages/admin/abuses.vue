<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="900">
		<div class="lcixvhis">
			<div class="_section reports">
				<div class="_content">
					<div class="inputs" style="display: flex;">
						<FormSelect v-model="state" style="margin: 0; flex: 1;">
							<template #label>{{ i18n.ts.state }}</template>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="unresolved">{{ i18n.ts.unresolved }}</option>
							<option value="resolved">{{ i18n.ts.resolved }}</option>
						</FormSelect>
						<FormSelect v-model="targetUserOrigin" style="margin: 0; flex: 1;">
							<template #label>{{ i18n.ts.reporteeOrigin }}</template>
							<option value="combined">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.local }}</option>
							<option value="remote">{{ i18n.ts.remote }}</option>
						</FormSelect>
						<FormSelect v-model="reporterOrigin" style="margin: 0; flex: 1;">
							<template #label>{{ i18n.ts.reporterOrigin }}</template>
							<option value="combined">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.local }}</option>
							<option value="remote">{{ i18n.ts.remote }}</option>
						</FormSelect>
					</div>

					<MkPagination v-slot="{items}" ref="reports" :pagination="pagination" style="margin-top: var(--margin);">
						<XAbuseReport v-for="report in items" :key="report.id" :report="report" @resolved="resolved"/>
					</MkPagination>
				</div>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import FormSelect from '@/components/form/select.vue';
import MkPagination from '@/components/ui/pagination.vue';
import XAbuseReport from '@/components/abuse-report.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let reports = $ref<InstanceType<typeof MkPagination>>();

let state = $ref('unresolved');
let reporterOrigin = $ref('combined');
let targetUserOrigin = $ref('combined');

const pagination = {
	endpoint: 'admin/abuse-user-reports' as const,
	limit: 10,
	params: computed(() => ({
		state,
		reporterOrigin,
		targetUserOrigin,
	})),
};

function resolved(reportId) {
	reports.removeItem(item => item.id === reportId);
}

definePageMetadata({
	title: i18n.ts.abuseReports,
	icon: 'fas fa-exclamation-circle',
});
</script>

<style lang="scss" scoped>
.lcixvhis {
	margin: var(--margin);
}
</style>
