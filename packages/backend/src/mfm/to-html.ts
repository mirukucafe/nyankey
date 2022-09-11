import { JSDOM } from 'jsdom';
import * as mfm from 'mfm-js';
import config from '@/config/index.js';
import { UserProfiles } from '@/models/index.js';
import { extractMentions } from '@/misc/extract-mentions.js';
import { intersperse } from '@/prelude/array.js';

// Transforms MFM to HTML, given the MFM text and a list of user IDs that are
// mentioned in the text. If the list of mentions is not given, all mentions
// from the text will be extracted.
export async function toHtml(mfmText: string, mentions?: string[]): Promise<string | null> {
	const nodes = mfm.parse(mfmText);
	if (nodes.length === 0) {
		return null;
	}

	const doc = new JSDOM('').window.document;

	const handlers: { [K in mfm.MfmNode['type']]: (node: mfm.NodeType<K>) => Promise<Node> } = {
		async bold(node) {
			const el = doc.createElement('b');
			appendChildren(node.children, el);
			return el;
		},

		async small(node) {
			const el = doc.createElement('small');
			appendChildren(node.children, el);
			return el;
		},

		async strike(node) {
			const el = doc.createElement('del');
			appendChildren(node.children, el);
			return el;
		},

		async italic(node) {
			const el = doc.createElement('i');
			appendChildren(node.children, el);
			return el;
		},

		async fn(node) {
			const el = doc.createElement('i');
			appendChildren(node.children, el);
			return el;
		},

		async blockCode(node) {
			const pre = doc.createElement('pre');
			const inner = doc.createElement('code');
			inner.textContent = node.props.code;
			pre.appendChild(inner);
			return pre;
		},

		async center(node) {
			const el = doc.createElement('div');
			appendChildren(node.children, el);
			return el;
		},

		async emojiCode(node) {
			return doc.createTextNode(`\u200B:${node.props.name}:\u200B`);
		},

		async unicodeEmoji(node) {
			return doc.createTextNode(node.props.emoji);
		},

		async hashtag(node) {
			const a = doc.createElement('a');
			a.href = `${config.url}/tags/${node.props.hashtag}`;
			a.textContent = `#${node.props.hashtag}`;
			a.setAttribute('rel', 'tag');
			return a;
		},

		async inlineCode(node) {
			const el = doc.createElement('code');
			el.textContent = node.props.code;
			return el;
		},

		async mathInline(node) {
			const el = doc.createElement('code');
			el.textContent = node.props.formula;
			return el;
		},

		async mathBlock(node) {
			const el = doc.createElement('code');
			el.textContent = node.props.formula;
			return el;
		},

		async link(node) {
			const a = doc.createElement('a');
			a.href = node.props.url;
			appendChildren(node.children, a);
			return a;
		},

		async mention(node): Promise<HTMLElement | Text> {
			const { username, host, acct } = node.props;
			const ids = mentions ?? extractMentions(nodes);
			if (ids.length > 0) {
				const mentionedUsers = await UserProfiles.createQueryBuilder('user_profile')
					.leftJoin('user_profile.user', 'user')
					.select('user.username', 'username')
					.addSelect('user.host', 'host')
					// links should preferably use user friendly urls, only fall back to AP ids
					.addSelect('COALESCE(user_profile.url, user.uri)', 'url')
					.where('"userId" IN (:...ids)', { ids })
					.getRawMany();
				const userInfo = mentionedUsers.find(user => user.username === username && user.host === host);
				if (userInfo != null) {
					// Mastodon microformat: span.h-card > a.u-url.mention
					const a = doc.createElement('a');
					a.href = userInfo.url ?? `${config.url}/${acct}`;
					a.className = 'u-url mention';
					a.textContent = acct;

					const card = doc.createElement('span');
					card.className = 'h-card';
					card.appendChild(a);
					return card;
				}
			}
			// this user does not actually exist
			return doc.createTextNode(acct);
		},

		async quote(node) {
			const el = doc.createElement('blockquote');
			appendChildren(node.children, el);
			return el;
		},

		async text(node) {
			const el = doc.createElement('span');
			const nodes = node.props.text.split(/\r\n|\r|\n/).map(x => doc.createTextNode(x));

			for (const x of intersperse<FIXME | 'br'>('br', nodes)) {
				el.appendChild(x === 'br' ? doc.createElement('br') : x);
			}

			return el;
		},

		async url(node) {
			const a = doc.createElement('a');
			a.href = node.props.url;
			a.textContent = node.props.url;
			return a;
		},

		async search(node) {
			const a = doc.createElement('a');
			a.href = `https://www.google.com/search?q=${node.props.query}`;
			a.textContent = node.props.content;
			return a;
		},
	};

	async function appendChildren(children: mfm.MfmNode[], targetElement: HTMLElement): Promise<void> {
		type HandlerFunc = (node: mfm.MfmNode) => Promise<Node>;
		const htmlChildren = await Promise.all(children.map(x => (handlers[x.type] as HandlerFunc)(x)));

		for (const child of htmlChildren) {
			targetElement.appendChild(child);
		}
	}

	await appendChildren(nodes, doc.body);

	return `<p>${doc.body.innerHTML}</p>`;
}
