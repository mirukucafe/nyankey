import * as foundkey from 'foundkey-js';
import * as Acct from 'foundkey-js/built/acct';

export const acct = (user: foundkey.Acct) => {
	return Acct.toString(user);
};

export const userName = (user: foundkey.entities.User) => {
	return user.name || user.username;
};

export const userPage = (user: foundkey.Acct, path?, absolute = false) => {
	return `${absolute ? origin : ''}/@${acct(user)}${(path ? `/${path}` : '')}`;
};
