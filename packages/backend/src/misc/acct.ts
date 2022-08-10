export type Acct = {
	username: string;
	host: string | null;
};

export function parse(acct: string): Acct {
	const split = acct.split('@');
	if (split[0].length === 0) {
		// there was an initial at
		split.shift();
	}
	return { username: split[0], host: split[1] || null };
}

export function toString(acct: Acct): string {
	return acct.host == null ? acct.username : `${acct.username}@${acct.host}`;
}
