<template>
<div class="mk-app">
	<a v-if="root" href="https://akkoma.dev/FoundKeyGang/FoundKey/" target="_blank" class="git-corner" aria-label="View source on Gitea">
		<svg width="80" height="80" viewBox="-85 -7 191 191" style="fill:var(--panel); color:var(--fg); position: fixed; z-index: 10; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M-85,-7 L106,184 L106,-7 Z"></path><path d="M90.156 41.965 50.036 1.848a5.918 5.918 0 0 0-8.372 0l-8.328 8.332 10.566 10.566a7.03 7.03 0 0 1 7.23 1.684 7.034 7.034 0 0 1 1.669 7.277l10.187 10.184a7.028 7.028 0 0 1 7.278 1.672 7.04 7.04 0 0 1 0 9.957 7.05 7.05 0 0 1-9.965 0 7.044 7.044 0 0 1-1.528-7.66l-9.5-9.497V59.36a7.04 7.04 0 0 1 1.86 11.29 7.04 7.04 0 0 1-9.957 0 7.04 7.04 0 0 1 0-9.958 7.06 7.06 0 0 1 2.304-1.539V33.926a7.049 7.049 0 0 1-3.82-9.234L29.242 14.272 1.73 41.777a5.925 5.925 0 0 0 0 8.371L41.852 90.27a5.925 5.925 0 0 0 8.37 0l39.934-39.934a5.925 5.925 0 0 0 0-8.371" style="fill:currentcolor"></path></svg>
	</a>

	<div v-if="!narrow && !root" class="side">
		<XKanban class="kanban" full/>
	</div>

	<div class="main">
		<XKanban v-if="narrow && !root" class="banner" :powered-by="root"/>

		<div class="contents">
			<XHeader v-if="!root" class="header" :info="pageInfo"/>
			<main>
				<RouterView/>
			</main>
			<div v-if="!root" class="powered-by">
				<b><MkA to="/">{{ host }}</MkA></b>
				<small>Powered by <a href="https://akkoma.dev/FoundKeyGang/FoundKey" target="_blank">FoundKey</a></small>
			</div>
		</div>
	</div>

	<transition :name="defaultStore.state.animation ? 'tray-back' : ''">
		<div
			v-if="showMenu"
			class="menu-back _modalBg"
			@click="showMenu = false"
			@touchstart.passive="showMenu = false"
		></div>
	</transition>

	<transition :name="defaultStore.state.animation ? 'tray' : ''">
		<div v-if="showMenu" class="menu">
			<MkA to="/" class="link" active-class="active"><i class="fas fa-home icon"></i>{{ i18n.ts.home }}</MkA>
			<MkA to="/explore" class="link" active-class="active"><i class="fas fa-hashtag icon"></i>{{ i18n.ts.explore }}</MkA>
			<MkA to="/featured" class="link" active-class="active"><i class="fas fa-fire-alt icon"></i>{{ i18n.ts.featured }}</MkA>
			<MkA to="/channels" class="link" active-class="active"><i class="fas fa-satellite-dish icon"></i>{{ i18n.ts.channel }}</MkA>
			<div class="action">
				<button class="_buttonPrimary" @click="signup()">{{ i18n.ts.signup }}</button>
				<button class="_button" @click="signin()">{{ i18n.ts.login }}</button>
			</div>
		</div>
	</transition>
</div>
</template>

<script lang="ts" setup>
import { ComputedRef, onMounted, provide } from 'vue';
import XHeader from './header.vue';
import XKanban from './kanban.vue';
import { host, instanceName } from '@/config';
import * as os from '@/os';
import MkPagination from '@/components/ui/pagination.vue';
import XSigninDialog from '@/components/signin-dialog.vue';
import XSignupDialog from '@/components/signup-dialog.vue';
import MkButton from '@/components/ui/button.vue';
import { ColdDeviceStorage, defaultStore } from '@/store';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const DESKTOP_THRESHOLD = 1100;

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
	if (pageMetadata.value) {
		document.title = `${pageMetadata.value.title} | ${instanceName}`;
	}
});

const announcements = {
	endpoint: 'announcements',
	limit: 10,
};
let showMenu = $ref(false);
let isDesktop = $ref(window.innerWidth >= DESKTOP_THRESHOLD);
let narrow = $ref(window.innerWidth < 1280);

const keymap = $computed(() => {
	return {
		'd': () => {
			if (ColdDeviceStorage.get('syncDeviceDarkMode')) return;
			defaultStore.set('darkMode', !defaultStore.state.darkMode);
		},
		's': () => {
			mainRouter.push('/search');
		},
	};
});

const root = $computed(() => mainRouter.currentRoute.value.name === 'index');

function signin() {
	os.popup(XSigninDialog, {
		autoSet: true,
	}, {}, 'closed');
}

function signup() {
	os.popup(XSignupDialog, {
		autoSet: true,
	}, {}, 'closed');
}

onMounted(() => {
	if (!isDesktop) {
		window.addEventListener('resize', () => {
			if (window.innerWidth >= DESKTOP_THRESHOLD) isDesktop = true;
		}, { passive: true });
	}
});
</script>

<style>
.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}
</style>

<style lang="scss" scoped>
.tray-enter-active,
.tray-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-enter-from,
.tray-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.tray-back-enter-active,
.tray-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-back-enter-from,
.tray-back-leave-active {
	opacity: 0;
}

.mk-app {
	display: flex;
	min-height: 100vh;
	background-position: center;
	background-size: cover;
	background-attachment: fixed;

	> .side {
		width: 500px;
		height: 100vh;

		> .kanban {
			position: fixed;
			top: 0;
			left: 0;
			width: 500px;
			height: 100vh;
			overflow: auto;
		}
	}

	> .main {
		flex: 1;
		min-width: 0;

		> .banner {
		}

		> .contents {
			position: relative;
			z-index: 1;

			> .powered-by {
				padding: 28px;
				font-size: 14px;
				text-align: center;
				border-top: 1px solid var(--divider);

				> small {
					display: block;
					margin-top: 8px;
					opacity: 0.5;
				}
			}
		}
	}

	> .menu-back {
		position: fixed;
		z-index: 1001;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
	}

	> .menu {
		position: fixed;
		z-index: 1001;
		top: 0;
		left: 0;
		width: 240px;
		height: 100vh;
		background: var(--panel);

		> .link {
			display: block;
			padding: 16px;

			> .icon {
				margin-right: 1em;
			}
		}

		> .action {
			padding: 16px;

			> button {
				display: block;
				width: 100%;
				padding: 10px;
				box-sizing: border-box;
				text-align: center;
				border-radius: 999px;

				&._button {
					background: var(--panel);
				}

				&:first-child {
					margin-bottom: 16px;
				}
			}
		}
	}
}
</style>
