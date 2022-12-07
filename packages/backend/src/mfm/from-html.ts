import { URL } from 'node:url';
import * as parse5 from 'parse5';
import * as TreeAdapter from 'parse5/dist/tree-adapters/default';

const treeAdapter = parse5.defaultTreeAdapter;

const urlRegex = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+/;
const urlRegexFull = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+$/;

function getAttr(node: TreeAdapter.Node, attr: string): string {
	return node.attrs.find(({ name }) => name === attr)?.value;
}
function attrHas(node: TreeAdapter.Node, attr: string, value: string): boolean {
	const attrValue = getAttr(node, attr);
	if (!attrValue) return false;

	return new RegExp('\\b' + value + '\\b').test(attrValue);
}

export function fromHtml(html: string, quoteUri?: string | null): string {
	const dom = parse5.parseFragment(
		// some AP servers like Pixelfed use br tags as well as newlines
		html.replace(/<br\s?\/?>\r?\n/gi, '\n'),
	);

	let text = '';

	for (const n of dom.childNodes) {
		analyze(n);
	}

	return text.trim();

	function getText(node: TreeAdapter.Node): string {
		if (treeAdapter.isTextNode(node)) return node.value;
		if (!treeAdapter.isElementNode(node)) return '';
		if (node.nodeName === 'br') return '\n';

		if (node.childNodes.length > 0) {
			return node.childNodes.map(n => getText(n)).join('');
		}

		return '';
	}

	function appendChildren(childNodes: TreeAdapter.ChildNode[]): void {
		if (childNodes.length > 0) {
			for (const n of childNodes) {
				analyze(n);
			}
		}
	}

	function analyze(node: TreeAdapter.Node): void {
		if (treeAdapter.isTextNode(node)) {
			text += node.value;
			return;
		}

		// Skip comment or document type node
		if (!treeAdapter.isElementNode(node)) return;

		switch (node.nodeName) {
			case 'br': {
				text += '\n';
				break;
			}

			case 'a':
			{
				const txt = getText(node);
				const href = getAttr(node, 'href');

				// hashtags
				if (txt.startsWith('#') && href && (attrHas(node, 'rel', 'tag') || attrHas(node, 'class', 'hashtag'))) {
					text += txt;
				// mentions
				} else if (txt.startsWith('@') && !attrHas(node, 'rel', 'me')) {
					const part = txt.split('@');

					if (part.length === 2 && href) {
						// restore the host name part
						const acct = `${txt}@${(new URL(href)).hostname}`;
						text += acct;
					} else if (part.length === 3) {
						text += txt;
					}
				// other
				} else {
					const generateLink = () => {
						if (!href && !txt) {
							return '';
						}
						if (!href) {
							return txt;
						}
						if (!txt || txt === href) { // #6383: Missing text node
							if (href.match(urlRegexFull)) {
								return href;
							} else {
								return `<${href}>`;
							}
						}
						if (href.match(urlRegex) && !href.match(urlRegexFull)) {
							return `[${txt}](<${href}>)`; // #6846
						} else {
							return `[${txt}](${href})`;
						}
					};

					text += generateLink();
				}
				break;
			}

			case 'h1':
			{
				text += '【';
				appendChildren(node.childNodes);
				text += '】\n';
				break;
			}

			case 'b':
			case 'strong':
			{
				text += '**';
				appendChildren(node.childNodes);
				text += '**';
				break;
			}

			case 'small':
			{
				text += '<small>';
				appendChildren(node.childNodes);
				text += '</small>';
				break;
			}

			case 's':
			case 'del':
			{
				text += '~~';
				appendChildren(node.childNodes);
				text += '~~';
				break;
			}

			case 'i':
			case 'em':
			{
				text += '<i>';
				appendChildren(node.childNodes);
				text += '</i>';
				break;
			}

			// block code (<pre><code>)
			case 'pre': {
				if (node.childNodes.length === 1 && node.childNodes[0].nodeName === 'code') {
					text += '\n```\n';
					text += getText(node.childNodes[0]);
					text += '\n```\n';
				} else {
					appendChildren(node.childNodes);
				}
				break;
			}

			// inline code (<code>)
			case 'code': {
				text += '`';
				appendChildren(node.childNodes);
				text += '`';
				break;
			}

			case 'blockquote': {
				const t = getText(node);
				if (t) {
					text += '\n> ';
					text += t.split('\n').join('\n> ');
				}
				break;
			}

			case 'p':
			case 'h2':
			case 'h3':
			case 'h4':
			case 'h5':
			case 'h6':
			{
				text += '\n\n';
				appendChildren(node.childNodes);
				break;
			}

			// other block elements
			case 'div':
			case 'header':
			case 'footer':
			case 'article':
			case 'li':
			case 'dt':
			case 'dd':
			{
				text += '\n';
				appendChildren(node.childNodes);
				break;
			}

			case 'span':
			{
				if (attrHas(node, 'class', 'quote-inline') && quoteUri && getText(node).trim() === `RE: ${quoteUri}`) {
					// embedded quote thingy for backwards compatibility, don't show it
				} else {
					appendChildren(node.childNodes);
				}
				break;
			}

			default:	// includes inline elements
			{
				appendChildren(node.childNodes);
				break;
			}
		}
	}
}
