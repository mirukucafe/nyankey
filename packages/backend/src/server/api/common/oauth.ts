import * as crypto from 'node:crypto';
import Koa from 'koa';
import { IsNull, Not } from 'typeorm';
import { Apps, AuthSessions } from '@/models/index.js';
import { compareUrl } from './compare-url.js';

export async function oauth(ctx: Koa.Context): void {
	const {
		grant_type,
		code,
		redirect_uri,
		code_verifier,
	} = ctx.request.body;

	// check if any of the parameters are null or empty string
	if ([grant_type, code].some(x => !x)) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'invalid_request',
		};
		return;
	}

	if (grant_type !== 'authorization_code') {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'unsupported_grant_type',
			error_description: 'only authorization_code grants are supported',
		};
		return;
	}

	const authHeader = ctx.headers.authorization;
	if (!authHeader?.toLowerCase().startsWith('basic ')) {
		ctx.response.status = 401;
		ctx.response.set('WWW-Authenticate', 'Basic');
		ctx.response.body = {
			error: 'invalid_client',
			error_description: 'HTTP Basic Authentication required',
		};
		return;
	}

	const [client_id, client_secret] = new Buffer(authHeader.slice(6), 'base64')
		.toString('ascii')
		.split(':', 2);

	const [app, session] = await Promise.all([
		Apps.findOneBy({
			id: client_id,
			secret: client_secret,
		}),
		AuthSessions.findOne({
			where: {
				appId: client_id,
				token: code,
				// only check for approved auth sessions
				accessTokenId: Not(IsNull()),
			},
			relations: {
				accessToken: true,
			},
		}),
	]);
	if (app == null) {
		ctx.response.status = 401;
		ctx.response.set('WWW-Authenticate', 'Basic');
		ctx.response.body = {
			error: 'invalid_client',
			error_description: 'authentication failed',
		};
		return;
	}
	if (session == null) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'invalid_grant',
		};
		return;
	}

	// check PKCE challenge, if provided before
	if (session.pkceChallenge) {
		// Also checking the client's homework, the RFC says:
		//> minimum length of 43 characters and a maximum length of 128 characters
		if (!code_verifier || code_verifier.length < 43 || code_verifier.length > 128) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'invalid_grant',
				error_description: 'invalid or missing PKCE code_verifier',
			};
			return;
		} else {
			// verify that (from RFC 7636):
			//> BASE64URL-ENCODE(SHA256(ASCII(code_verifier))) == code_challenge
			const hash = crypto.createHash('sha256');
			hash.update(code_verifier);

			if (hash.digest('base64url') !== code_challenge) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'invalid_grant',
					error_description: 'invalid PKCE code_verifier',
				};
				return;
			}
		}
	}

	// check redirect URI
	if (!compareUrl(app.callbackUrl, redirect_uri)) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'invalid_grant',
			error_description: 'Mismatched redirect_uri',
		};
		return;
	}

	// session is single use
	await AuthSessions.delete(session.id),

	ctx.response.status = 200;
	ctx.response.body = {
		access_token: session.accessToken.token,
		token_type: 'bearer',
		scope: session.accessToken.permission.join(' '),
	};
}
