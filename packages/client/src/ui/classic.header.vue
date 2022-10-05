<template>
<div class="azykntjl">
	<div class="body">
		<div class="left">
			<MkA v-tooltip="i18n.ts.timeline" class="item index" active-class="active" to="/" exact>
				<i class="fas fa-home fa-fw"></i>
			</MkA>
			<template v-for="item in menu">
				<div v-if="item === '-'" class="divider"></div>
				<component :is="menuDef[item].to ? 'MkA' : 'button'" v-else-if="menuDef[item] && (menuDef[item].show !== false)" v-tooltip="i18n.ts[menuDef[item].title]" class="item _button" :class="item" active-class="active" :to="menuDef[item].to" v-on="menuDef[item].action ? { click: menuDef[item].action } : {}">
					<i class="fa-fw" :class="menuDef[item].icon"></i>
					<span v-if="menuDef[item].indicated" class="indicator"><i class="fas fa-circle"></i></span>
				</component>
			</template>
			<div class="divider"></div>
			<MkA v-if="iAmModerator" v-tooltip="i18n.ts.controlPanel" class="item" active-class="active" to="/admin" :behavior="settingsWindowed ? 'modalWindow' : null">
				<i class="fas fa-door-open fa-fw"></i>
			</MkA>
			<button class="item _button" @click="more">
				<i class="fas fa-ellipsis-h fa-fw"></i>
				<span v-if="otherNavItemIndicated" class="indicator"><i class="fas fa-circle"></i></span>
			</button>
		</div>
		<div class="right">
			<MkA v-tooltip="i18n.ts.settings" class="item" active-class="active" to="/settings" :behavior="settingsWindowed ? 'modalWindow' : null">
				<i class="fas fa-cog fa-fw"></i>
			</MkA>
			<button class="item _button account" @click="openAccountMenuWrapper">
				<MkAvatar :user="$i" class="avatar"/><MkAcct class="acct" :user="$i"/>
			</button>
			<div class="post" @click="post">
				<MkButton class="button" gradate full rounded>
					<i class="fas fa-pencil-alt fa-fw"></i>
				</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, watch } from 'vue';
import * as os from '@/os';
import { menuDef } from '@/menu';
import { openAccountMenu, $i, iAmModerator } from '@/account';
import MkButton from '@/components/ui/button.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

let settingsWindowed = $ref(false);

const menu = $computed(() => defaultStore.state.menu);
const otherNavItemIndicated = $computed((): boolean => {
	for (const def in menuDef) {
		if (menu.includes(def)) continue;
		if (menuDef[def].indicated) return true;
	}
	return false;
});

function calcViewState(): void {
	settingsWindowed = (window.innerWidth > 1400);
}

watch(defaultStore.reactiveState.menuDisplay, calcViewState);

window.addEventListener('resize', calcViewState);
calcViewState();

function post(): void {
	os.post();
}

function more(ev: MouseEvent | TouchEvent): void {
	os.popup(defineAsyncComponent(() => import('@/components/launch-pad.vue')), {
		src: ev.currentTarget ?? ev.target,
		anchor: { x: 'center', y: 'bottom' },
	}, {
	}, 'closed');
}

function openAccountMenuWrapper(ev: MouseEvent): void {
	openAccountMenu({
		withExtraOperation: true,
	}, ev);
}
</script>

<style lang="scss" scoped>
.azykntjl {
	$height: 60px;
	$avatar-size: 32px;
	$avatar-margin: 8px;

	position: sticky;
	top: 0;
	z-index: 1000;
	width: 100%;
	height: $height;
	background-color: var(--bg);

	> .body {
		max-width: 1380px;
		margin: 0 auto;
		display: flex;

		> .right,
		> .left {

			> .item {
				position: relative;
				font-size: 0.9em;
				display: inline-block;
				padding: 0 12px;
				line-height: $height;

				> i,
				> .avatar {
					margin-right: 0;
				}

				> i {
					left: 10px;
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

			> .divider {
				display: inline-block;
				height: 16px;
				margin: 0 10px;
				border-right: solid 0.5px var(--divider);
			}

			> .post {
				display: inline-block;
			
				> .button {
					width: 40px;
					height: 40px;
					padding: 0;
					min-width: 0;
				}
			}

			> .account {
				display: inline-flex;
				align-items: center;
				vertical-align: top;
				margin-right: 8px;

				> .acct {
					margin-left: 8px;
				}
			}
		}

		> .right {
			margin-left: auto;
		}
	}
}
</style>
