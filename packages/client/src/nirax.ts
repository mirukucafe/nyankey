// NIRAX --- A lightweight router

import { EventEmitter } from 'eventemitter3';
import { Component, shallowRef, ShallowRef } from 'vue';
import { pleaseLogin } from '@/scripts/please-login';
import { safeURIDecode } from '@/scripts/safe-uri-decode';

type RouteDef = {
	path: string;
	component: Component;
	query?: Record<string, string>;
	loginRequired?: boolean;
	name?: string;
	hash?: string;
	globalCacheKey?: string;
};

type ParsedPath = (string | {
	name: string;
	startsWith?: string;
	wildcard?: boolean;
	optional?: boolean;
})[];

function parsePath(path: string): ParsedPath {
	const res = [] as ParsedPath;

	for (const part of path.substring(1).split('/')) {
		if (part.includes(':')) {
			const prefix = part.substring(0, part.indexOf(':'));
			const placeholder = part.substring(part.indexOf(':') + 1);
			const wildcard = placeholder.includes('(*)');
			const optional = placeholder.endsWith('?');
			res.push({
				name: placeholder.replace('(*)', '').replace('?', ''),
				startsWith: prefix !== '' ? prefix : undefined,
				wildcard,
				optional,
			});
		} else if (part.length !== 0) {
			res.push(part);
		}
	}

	return res;
}

export class Router extends EventEmitter<{
	change: (ctx: {
		beforePath: string;
		path: string;
		route: RouteDef | null;
		props: Map<string, string> | null;
		key: string;
	}) => void;
	push: (ctx: {
		beforePath: string;
		path: string;
		route: RouteDef | null;
		props: Map<string, string> | null;
		key: string;
	}) => void;
	same: () => void;
}> {
	private routes: RouteDef[];
	private currentPath: string;
	private currentComponent: Component | null = null;
	private currentProps: Map<string, string> | null = null;
	private currentKey = Date.now().toString();

	public currentRoute: ShallowRef<RouteDef | null> = shallowRef(null);
	public navHook: ((path: string) => boolean) | null = null;

	constructor(routes: Router['routes'], currentPath: Router['currentPath']) {
		super();

		this.routes = routes;
		this.currentPath = currentPath;
		this.navigate(currentPath, null, true);
	}

	public resolve(_path: string): { route: RouteDef; props: Map<string, string>; } | null {
		let queryString: string | null = null;
		let hash: string | null = null;
		let path: string = _path;
		if (path[0] === '/') path = path.substring(1);
		if (path.includes('#')) {
			hash = path.substring(path.indexOf('#') + 1);
			path = path.substring(0, path.indexOf('#'));
		}
		if (path.includes('?')) {
			queryString = path.substring(path.indexOf('?') + 1);
			path = path.substring(0, path.indexOf('?'));
		}

		if (_DEV_) console.log('Routing: ', path, queryString);

		const _parts = path.split('/').filter(part => part.length !== 0);

		forEachRouteLoop:
		for (const route of this.routes) {
			let parts = [ ..._parts ];
			const props = new Map<string, string>();

			pathMatchLoop:
			for (const p of parsePath(route.path)) {
				if (typeof p === 'string') {
					if (p === parts[0]) {
						parts.shift();
					} else {
						continue forEachRouteLoop;
					}
				} else {
					if (parts[0] == null && !p.optional) {
						continue forEachRouteLoop;
					}
					if (p.wildcard) {
						if (parts.length !== 0) {
							props.set(p.name, safeURIDecode(parts.join('/')));
							parts = [];
						}
						break pathMatchLoop;
					} else {
						if (p.startsWith) {
							if (parts[0] == null || !parts[0].startsWith(p.startsWith)) continue forEachRouteLoop;

							props.set(p.name, safeURIDecode(parts[0].substring(p.startsWith.length)));
							parts.shift();
						} else {
							if (parts[0]) {
								props.set(p.name, safeURIDecode(parts[0]));
							}
							parts.shift();
						}
					}
				}
			}

			if (parts.length !== 0) continue forEachRouteLoop;

			if (route.hash != null && hash != null) {
				props.set(route.hash, safeURIDecode(hash));
			}

			if (route.query != null && queryString != null) {
				const queryObject = [...new URLSearchParams(queryString).entries()]
					.reduce((obj, entry) => ({ ...obj, [entry[0]]: entry[1] }), {});

				for (const q in route.query) {
					const as = route.query[q];
					if (queryObject[q]) {
						props.set(as, safeURIDecode(queryObject[q]));
					}
				}
			}

			return {
				route,
				props,
			};
		}

		return null;
	}

	private navigate(path: string, key: string | null | undefined, initial = false): void {
		const beforePath = this.currentPath;
		this.currentPath = path;

		const res = this.resolve(this.currentPath);

		if (res == null) {
			throw new Error('no route found for: ' + path);
		}

		if (res.route.loginRequired) {
			pleaseLogin('/');
		}

		const isSamePath = beforePath === path;

		this.currentComponent = res.route.component;
		this.currentProps = res.props;
		this.currentRoute.value = res.route;
		this.currentKey = this.currentRoute.value.globalCacheKey ?? key ?? (isSamePath ? this.currentKey : null) ?? Date.now().toString();

		if (!initial) {
			this.emit('change', {
				beforePath,
				path,
				route: this.currentRoute.value,
				props: this.currentProps,
				key: this.currentKey,
			});
		}
	}

	public getCurrentComponent(): Component | null {
		return this.currentComponent;
	}

	public getCurrentProps(): Map<string, string> | null {
		return this.currentProps;
	}

	public getCurrentPath(): string {
		return this.currentPath;
	}

	public getCurrentKey(): string {
		return this.currentKey;
	}

	public push(path: string): void {
		const beforePath = this.currentPath;
		if (path === beforePath) {
			this.emit('same');
			return;
		}
		if (this.navHook) {
			const cancel = this.navHook(path);
			if (cancel) return;
		}
		this.navigate(path, null);
		this.emit('push', {
			beforePath,
			path,
			route: this.currentRoute.value,
			props: this.currentProps,
			key: this.currentKey,
		});
	}

	public change(path: string, key?: string | null): void {
		this.navigate(path, key);
	}
}
