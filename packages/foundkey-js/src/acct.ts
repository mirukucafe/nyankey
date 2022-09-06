export type Acct = {
	username: string;
	host: string | null;
};

export function parse(acct: string): Acct {
	const acct_ = acct.startsWith('@') ? acct.slice(1) : acct;
	const split = acct_.split('@', 2);
	return { username: split[0], host: split[1] || null };
}

export function toString(acct: Acct): string {
	return acct.host == null ? acct.username : `${acct.username}@${acct.host}`;
}
