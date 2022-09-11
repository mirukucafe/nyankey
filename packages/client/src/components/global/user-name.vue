<template>
<Mfm :text="user.name || user.username" :plain="true" :nowrap="nowrap" :custom-emojis="user.emojis"/>
</template>

<script lang="ts" setup>
import * as foundkey from 'foundkey-js';

withDefaults(defineProps<{
	user: foundkey.entities.User;
	nowrap?: boolean;
}>(), {
	nowrap: true,
});
</script>
