import { URL } from 'node:url';

/**
 * Compares two URLs for OAuth. The first parameter is the trusted URL
 * which decides how the comparison is conducted.
 *
 * Invalid URLs are never equal.
 *
 * Implements the current draft-ietf-oauth-security-topics-21 § 4.1.3
 * (published 2022-09-27)
 */
export function compareUrl(trusted: string, untrusted: string): boolean {
	let trustedUrl, untrustedUrl;

	try {
		trustedUrl = new URL(trusted);
		untrustedUrl = new URL(untrusted);
	} catch {
		return false;
	}

	// Excerpt from RFC 8252:
	//> Loopback redirect URIs use the "http" scheme and are constructed with
	//> the loopback IP literal and whatever port the client is listening on.
	//>  That is, "http://127.0.0.1:{port}/{path}" for IPv4, and
	//> "http://[::1]:{port}/{path}" for IPv6.
	//
	// To be nice we also include the "localhost" name, since it is required
	// to resolve to one of the other two.
	if (trustedUrl.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(trustedUrl.host)) {
		// localhost comparisons should ignore port number
		trustedUrl.port = '';
		untrustedUrl.port = '';
	}

	// security recommendation is to just compare the (normalized) string
	//> This document therefore advises to simplify the required logic and configuration
	//> by using exact redirect URI matching. This means the authorization server MUST
	//> compare the two URIs using simple string comparison as defined in [RFC3986],
	//> Section 6.2.1.
	return trustedUrl.href === untrustedUrl.href;
}
