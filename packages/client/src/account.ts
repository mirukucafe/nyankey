import { defineAsyncComponent, reactive } from 'vue';
import * as foundkey from 'foundkey-js';
import { showSuspendedDialog } from '@/scripts/show-suspended-dialog';
import { i18n } from '@/i18n';
import { del, get, set } from '@/scripts/idb-proxy';
import { waiting, api, popup, popupMenu, success, alert } from '@/os';
import { unisonReload, reloadChannel } from '@/scripts/unison-reload';
import { MenuItem } from '@/types/menu';

// TODO: 他のタブと永続化されたstateを同期

type Account = foundkey.entities.MeDetailed;

const accountData = localStorage.getItem('account');

// TODO: 外部からはreadonlyに
export const $i = accountData ? reactive(JSON.parse(accountData) as Account) : null;

export const iAmModerator = $i != null && ($i.isAdmin || $i.isModerator);

export async function signout() {
	waiting();
	localStorage.removeItem('account');

	if ($i) await removeAccount($i!.id);

	const accounts = await getAccounts();

	//#region Remove service worker registration
	try {
		if (navigator.serviceWorker.controller) {
			const registration = await navigator.serviceWorker.ready;
			const push = await registration.pushManager.getSubscription();
			if (push) {
				await api('sw/unregister', {
					endpoint: push.endpoint,
				});
			}
		}

		if (accounts.length === 0) {
			await navigator.serviceWorker.getRegistrations()
				.then(registrations => {
					return Promise.all(registrations.map(registration => registration.unregister()));
				});
		}
	} catch (err) {}
	//#endregion

	document.cookie = 'igi=; path=/';

	if (accounts.length > 0) login(accounts[0].token);
	else unisonReload('/');
}

export async function getAccounts(): Promise<{ id: Account['id'], token: Account['token'] }[]> {
	return (await get('accounts')) || [];
}

export async function addAccount(id: Account['id'], token: Account['token']) {
	const accounts = await getAccounts();
	if (!accounts.some(x => x.id === id)) {
		await set('accounts', accounts.concat([{ id, token }]));
	}
}

export async function removeAccount(id: Account['id']) {
	const accounts = await getAccounts();
	accounts.splice(accounts.findIndex(x => x.id === id), 1);

	if (accounts.length > 0) await set('accounts', accounts);
	else await del('accounts');
}

function fetchAccount(token: string): Promise<Account> {
	return new Promise((done, fail) => {
		// Fetch user
		api('i', {}, token)
		.then(res => {
			if (res.error) {
				if (res.error.code === 'SUSPENDED') {
					showSuspendedDialog().then(() => {
						signout();
					});
				} else {
					alert({
						type: 'error',
						title: i18n.ts.failedToFetchAccountInformation,
						text: JSON.stringify(res.error),
					});
				}
			} else {
				res.token = token;
				done(res);
			}
		})
		.catch(fail);
	});
}

export function updateAccount(accountData) {
	if (!$i) return;

	for (const [key, value] of Object.entries(accountData)) {
		$i![key] = value;
	}
	localStorage.setItem('account', JSON.stringify($i!));
}

export function refreshAccount() {
	if (!$i) return;

	return fetchAccount($i!.token).then(updateAccount);
}

export async function login(token: Account['token'], redirect?: string) {
	waiting();
	if (_DEV_) console.log('logging as token ', token);
	const me = await fetchAccount(token);
	localStorage.setItem('account', JSON.stringify(me));
	document.cookie = `token=${token}; path=/; max-age=31536000`; // bull dashboardの認証とかで使う
	await addAccount(me.id, token);

	if (redirect) {
		// 他のタブは再読み込みするだけ
		reloadChannel.postMessage(null);
		// このページはredirectで指定された先に移動
		location.href = redirect;
		return;
	}

	unisonReload();
}

export async function openAccountMenu(opts: {
	includeCurrentAccount?: boolean;
	withExtraOperation: boolean;
	active?: foundkey.entities.UserDetailed['id'];
	onChoose?: (account: foundkey.entities.UserDetailed) => void;
}, ev: MouseEvent) {
	const storedAccounts = await getAccounts().then(accounts => accounts.filter(x => x.id !== $i?.id));
	const accountsPromise = api('users/show', { userIds: storedAccounts.map(x => x.id) });

	const switchAccount = async (account: foundkey.entities.UserDetailed) => {
		const storedAccounts = await getAccounts();
		const token = storedAccounts.find(x => x.id === account.id)?.token;
		if (!token) {
			// TODO error handling?
		} else {
			login(token);
		}
	};
	const createItem = (account: foundkey.entities.UserDetailed): MenuItem => ({
		type: 'user',
		user: account,
		active: opts.active != null ? opts.active === account.id : false,
		action: () => {
			if (opts.onChoose) {
				opts.onChoose(account);
			} else {
				switchAccount(account);
			}
		},
	});
	const accountItemPromises: Promise<MenuItem[]> = storedAccounts.map(a => new Promise(res => {
		accountsPromise.then(accounts => {
			const account = accounts.find(x => x.id === a.id);
			if (account == null) return res(null);
			res(createItem(account));
		});
	}));

	const showSigninDialog = () => {
		popup(defineAsyncComponent(() => import('@/components/signin-dialog.vue')), {}, {
			done: res => {
				addAccount(res.id, res.i);
				success();
			},
		}, 'closed');
	}

	const createAccount = () => {
		popup(defineAsyncComponent(() => import('@/components/signup-dialog.vue')), {}, {
			done: res => {
				addAccount(res.id, res.i);
				login(res.i);
			},
		}, 'closed');
	};

	if (opts.withExtraOperation) {
		popupMenu([...[{
			type: 'link',
			text: i18n.ts.profile,
			to: `/@${ $i.username }`,
			avatar: $i,
		}, null, ...(opts.includeCurrentAccount && $i ? [createItem($i)] : []), ...accountItemPromises, {
			icon: 'fas fa-plus',
			text: i18n.ts.addAccount,
			action: () => {
				popupMenu([{
					text: i18n.ts.existingAccount,
					action: showSigninDialog,
				}, {
					text: i18n.ts.createAccount,
					action: createAccount,
				}], ev.currentTarget ?? ev.target);
			},
		}, {
			type: 'link',
			icon: 'fas fa-users',
			text: i18n.ts.manageAccounts,
			to: '/settings/accounts',
		}]], ev.currentTarget ?? ev.target ?? undefined, {
			align: 'left',
		});
	} else {
		popupMenu([...(opts.includeCurrentAccount && $i ? [createItem($i)] : []), ...accountItemPromises], ev.currentTarget ?? ev.target ?? undefined, {
			align: 'left',
		});
	}
}
