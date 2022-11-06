import { kinds } from '@/misc/api-permissions.js';
import config from '@/config/index.js';

// Since it cannot change while the server is running, we can serialize it once
// instead of having to serialize it every time it is requested.
export const oauthMeta = JSON.stringify({
	issuer: config.url,
	authorization_endpoint: `${config.url}/auth`,
	token_endpoint: `${config.apiUrl}/auth/session/oauth`,
	scopes_supported: kinds,
	response_types_supported: ['code'],
	grant_types_supported: ['authorization_code'],
	token_endpoint_auth_methods_supported: ['client_secret_basic'],
	service_documentation: `${config.url}/api-doc`,
	code_challenge_methods_supported: ['S256'],
});
