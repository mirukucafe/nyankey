<template>
<MkTime format="date" mode="absolute" :time="birthday" :utc="true"/> ({{ i18n.t('yearsOld', { age }) }})
</template>
<script lang="ts" setup>
import MkTime from '@/components/global/time.vue';
import { i18n } from '@/i18n';
import { YEAR } from '@/const';

const props = defineProps<{
	birthday: Date | string;
}>();

const age = $computed(() => {
	const now = new Date();
	const birthday = (typeof props.birthday === 'string') ? new Date(props.birthday) : props.birthday;

	return Math.floor((now.getTime() - birthday.getTime()) / YEAR);
});

</script>
