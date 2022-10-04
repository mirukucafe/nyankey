<template>
<div ref="sidebar" class="npcljfve" :class="{ iconOnly }">
	<button v-if="$i" class="item _button account" @click="openAccountMenuWrapper">
		<MkAvatar :user="$i" class="avatar"/><MkAcct class="text" :user="$i"/>
	</button>
	<div class="post" data-cy-open-post-form @click="() => { os.post(); }">
		<MkButton class="button" gradate full rounded>
			<i class="fas fa-pencil-alt fa-fw"></i><span v-if="!iconOnly" class="text">{{ i18n.ts.note }}</span>
		</MkButton>
	</div>
	<div class="divider"></div>
	<MkA class="item index" active-class="active" to="/" exact>
		<i class="fas fa-home fa-fw"></i><span class="text">{{ i18n.ts.timeline }}</span>
	</MkA>
	<template v-for="item in menu">
		<div v-if="item === '-'" class="divider"></div>
		<component :is="menuDef[item].to ? 'MkA' : 'button'" v-else-if="menuDef[item] && (menuDef[item].show !== false)" class="item _button" :class="item" active-class="active" :to="menuDef[item].to" v-on="menuDef[item].action ? { click: menuDef[item].action } : {}">
			<i class="fa-fw" :class="menuDef[item].icon"></i><span class="text">{{ i18n.ts[menuDef[item].title] }}</span>
			<span v-if="menuDef[item].indicated" class="indicator"><i class="fas fa-circle"></i></span>
		</component>
	</template>
	<div class="divider"></div>
	<MkA v-if="iAmModerator" class="item" active-class="active" to="/admin" :behavior="settingsWindowed ? 'modalWindow' : null">
		<i class="fas fa-door-open fa-fw"></i><span class="text">{{ i18n.ts.controlPanel }}</span>
	</MkA>
	<button class="item _button" @click="more">
		<i class="fas fa-ellipsis-h fa-fw"></i><span class="text">{{ i18n.ts.more }}</span>
		<span v-if="otherNavItemIndicated" class="indicator"><i class="fas fa-circle"></i></span>
	</button>
	<MkA class="item" active-class="active" to="/settings" :behavior="settingsWindowed ? 'modalWindow' : null">
		<i class="fas fa-cog fa-fw"></i><span class="text">{{ i18n.ts.settings }}</span>
	</MkA>
	<div class="divider"></div>
	<div class="about">
		<MkA class="link" to="/about">
			<img :src="$instance.iconUrl || $instance.faviconUrl || '/favicon.ico'" class="_ghost"/>
		</MkA>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, watch, onMounted, nextTick } from 'vue';
import * as os from '@/os';
import { menuDef } from '@/menu';
import { openAccountMenu, $i, iAmModerator } from '@/account';
import MkButton from '@/components/ui/button.vue';
import { StickySidebar } from '@/scripts/sticky-sidebar';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

let iconOnly = $ref(false);
let settingsWindowed = $ref(false);
let sidebar: HTMLElement | null = $ref(null);

const menu = $computed(() => defaultStore.state.menu);
const otherNavItemIndicated = $computed(() => {
	for (const def in menuDef) {
		if (menu.includes(def)) continue;
		if (menuDef[def].indicated) return true;
	}
	return false;
});

const emit = defineEmits<{
	(ev: 'change-view-mode'): void;
}>();

watch(defaultStore.reactiveState.menuDisplay, calcViewState);

watch(iconOnly, () => {
	nextTick(() => {
		emit('change-view-mode');
	});
});

onMounted(() => {
	if (sidebar?.parentElement) {
		const sticky = new StickySidebar(sidebar.parentElement, 16);
		window.addEventListener('scroll', () => {
			sticky.calc(window.scrollY);
		}, { passive: true });
	}
});

function calcViewState(): void {
	iconOnly = (window.innerWidth <= 1400) || (defaultStore.state.menuDisplay === 'sideIcon');
	settingsWindowed = (window.innerWidth > 1400);
}
window.addEventListener('resize', calcViewState);
calcViewState();

function more(ev: MouseEvent): void {
	os.popup(defineAsyncComponent(() => import('@/components/launch-pad.vue')), {
		src: ev.currentTarget ?? ev.target,
	}, {}, 'closed');
}

function openAccountMenuWrapper(ev: MouseEvent): void {
	openAccountMenu({
		withExtraOperation: true,
	}, ev);
}
</script>

<style lang="scss" scoped>
.npcljfve {
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$nav-icon-only-width: 78px; // TODO: どこかに集約したい
	$avatar-size: 32px;
	$avatar-margin: 8px;

	padding: 0 16px;
	box-sizing: border-box;
	width: 260px;

	&.iconOnly {
		flex: 0 0 $nav-icon-only-width;
		width: $nav-icon-only-width !important;

		> .divider {
			margin: 8px auto;
			width: calc(100% - 32px);
		}

		> .post {
			> .button {
				width: 46px;
				height: 46px;
				padding: 0;
			}
		}

		> .item {
			padding-left: 0;
			width: 100%;
			text-align: center;
			font-size: $ui-font-size * 1.1;
			line-height: 3.7rem;

			> i,
			> .avatar {
				margin-right: 0;
			}

			> i {
				left: 10px;
			}

			> .text {
				display: none;
			}
		}
	}

	> .divider {
		margin: 10px 0;
		border-top: solid 0.5px var(--divider);
	}

	> .post {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 16px 0;
		background: var(--bg);

		> .button {
			min-width: 0;
		}
	}

	> .about {
		fill: currentColor;
		padding: 8px 0 16px 0;
		text-align: center;

		> .link {
			display: block;
			width: 32px;
			margin: 0 auto;

			img {
				display: block;
				width: 100%;
			}
		}
	}

	> .item {
		position: relative;
		display: block;
		font-size: $ui-font-size;
		line-height: 2.6rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 100%;
		text-align: left;
		box-sizing: border-box;

		> i {
			width: 32px;
		}

		> i,
		> .avatar {
			margin-right: $avatar-margin;
		}

		> .avatar {
			width: $avatar-size;
			height: $avatar-size;
			vertical-align: middle;
		}

		> .indicator {
			position: absolute;
			top: 0;
			left: 0;
			color: var(--navIndicator);
			font-size: 8px;
			animation: blink 1s infinite;
		}

		&:hover {
			text-decoration: none;
			color: var(--navHoverFg);
		}

		&.active {
			color: var(--navActive);
		}
	}
}
</style>
