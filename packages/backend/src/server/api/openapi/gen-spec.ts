import config from '@/config/index.js';
import { kinds } from '@/misc/api-permissions.js';
import { I18n } from '@/misc/i18n.js';
import { errors as errorDefinitions } from '../error.js';
import endpoints from '../endpoints.js';
import { schemas, convertSchemaToOpenApiSchema } from './schemas.js';
import { httpCodes } from './http-codes.js';

const i18n = new I18n('en-US');

export function genOpenapiSpec() {
	const spec = {
		openapi: '3.0.0',

		info: {
			version: 'v1',
			title: 'FoundKey API',
			'x-logo': { url: '/static-assets/api-doc.png' },
		},

		externalDocs: {
			description: 'Repository',
			url: 'https://akkoma.dev/FoundKeyGang/FoundKey',
		},

		servers: [{
			url: config.apiUrl,
		}],

		paths: {} as any,

		components: {
			schemas,

			securitySchemes: {
				ApiKeyAuth: {
					type: 'apiKey',
					in: 'body',
					name: 'i',
				},
				OAuth: {
					type: 'oauth2',
					flows: {
						authorizationCode: {
							authorizationUrl: `${config.url}/auth`,
							tokenUrl: `${config.apiUrl}/auth/session/oauth`,
							scopes: kinds.reduce((acc, kind) => {
								acc[kind] = i18n.ts['_permissions'][kind];
								return acc;
							}, {}),
						},
					},
				},
			},
		},
	};

	for (const endpoint of endpoints.filter(ep => !ep.meta.secure)) {
		// generate possible responses, first starting with errors
		const responses = [
			// general error codes that can always happen
			'INVALID_PARAM',
			'INTERNAL_ERROR',
			// error codes that happen only if authentication is required
			...(!endpoint.meta.requireCredential ? [] : [
				'ACCESS_DENIED',
				'AUTHENTICATION_REQUIRED',
				'AUTHENTICATION_FAILED',
				'SUSPENDED',
			]),
			// error codes that happen only if a rate limit is defined
			...(!endpoint.meta.limit ? [] : [
				'RATE_LIMIT_EXCEEDED',
			]),
			// error codes that happen only if a file is required
			...(!endpoint.meta.requireFile ? [] : [
				'FILE_REQUIRED',
			]),
			// endpoint specific error codes
			...(endpoint.meta.errors ?? []),
		]
		.reduce((acc, code) => {
			const { message, httpStatusCode } = errorDefinitions[code];
			const httpCode = httpStatusCode.toString();

			if (!(httpCode in acc)) {
				acc[httpCode] = {
					description: httpCodes[httpCode],
					content: {
						'application/json': {
							schema: {
								'$ref': '#/components/schemas/Error',
							},
							examples: {},
						},
					},
				};
			}

			acc[httpCode].content['application/json'].examples[code] = {
				value: {
					error: {
						code,
						message,
						endpoint: endpoint.name,
					},
				},
			};

			return acc;
		}, {});

		// add successful response
		if (endpoint.meta.res) {
			responses['200'] = {
				description: 'OK',
				content: {
					'application/json': {
						schema: convertSchemaToOpenApiSchema(endpoint.meta.res),
					},
				},
			};
		} else {
			responses['204'] = {
				description: 'No Content',
			};
		}

		let desc = endpoint.meta.description ?? 'No description provided.';
		desc += `**Credential required**: *${endpoint.meta.requireCredential ? 'Yes' : 'No'}*`;
		if (endpoint.meta.kind) {
			desc += '\n\n**Permission**: `' + endpoint.meta.kind + '`';
		}
		if (endpoint.meta.limit) {
			const limit = endpoint.meta.limit;

			desc += '\n### Rate limit\nRate limiting group: `' + (limit.key ?? endpoint.name) + '`';
			if (limit.duration && limit.max) {
				desc += `    \nNo more than ${limit.max} requests every ${limit.duration} ms.`;
			}
			if (limit.minInterval) {
				desc += `    \nMinimum delay between each request: ${endpoint.meta.limit.minInterval} ms.`;
			}
		}

		const requestType = endpoint.meta.requireFile ? 'multipart/form-data' : 'application/json';
		const schema = endpoint.params;

		if (endpoint.meta.requireFile) {
			schema.properties.file = {
				type: 'string',
				format: 'binary',
				description: 'The file contents.',
			};
			schema.required.push('file');
		}

		const security = [
			{
				ApiKeyAuth: [],
			},
		];
		if (endpoint.meta.kind) {
			security.push({
				OAuth: [endpoint.meta.kind],
			});
		} else {
			security.push({
				OAuth: [],
			});
		}
		if (!endpoint.meta.requireCredential) {
			// add this to make authentication optional
			security.push({});
		}

		const info = {
			operationId: endpoint.name,
			summary: endpoint.name,
			description: desc,
			externalDocs: {
				description: 'Source code',
				url: `https://akkoma.dev/FoundKeyGang/FoundKey/src/branch/main/packages/backend/src/server/api/endpoints/${endpoint.name}.ts`,
			},
			tags: endpoint.meta.tags || undefined,
			security,
			requestBody: {
				required: true,
				content: {
					[requestType]: {
						schema,
					},
				},
			},
			responses,
			deprecated: endpoint.meta.stability === 'deprecated',
		};

		const path = {
			post: info,
		};
		if (endpoint.meta.allowGet) {
			path.get = { ...info };
			// API Key authentication is not permitted for GET requests
			path.get.security = path.get.security.filter(elem => !Object.prototype.hasOwnProperty.call(elem, 'ApiKeyAuth'));

			// fix the way parameters are passed
			delete path.get.requestBody;
			path.get.parameters = [];
			for (const name in schema.properties) {
				path.get.parameters.push({
					name,
					in: 'query',
					schema: schema.properties[name],
					required: schema.required?.includes(name),
				});
			}
		}

		spec.paths['/' + endpoint.name] = path;

		if (endpoint.meta.v2) {
			const route = `/v2/${endpoint.meta.v2.alias ?? endpoint.name.replace(/-/g, '_')}`;
			// we need a clone of the API endpoint info because otherwise we change it by reference
			const infoClone = structuredClone(info);
			// fix the way parameters are passed
			const hasBody = !(endpoint.meta.v2.method === 'get' || endpoint.meta.v2.method === 'delete');
			if (!hasBody) {
				// these methods do not (usually) have a body
				delete infoClone.requestBody;
				infoClone.parameters = [];
				for (const name in schema.properties) {
					infoClone.parameters.push({
						name,
						in: endpoint.meta.v2?.pathParameters?.includes(name) ? 'path' : 'query',
						schema: schema.properties[name],
						required: endpoint.meta.v2?.pathParameters?.includes(name) || schema.required?.includes(name) || false,
					});
				}
			} else if (endpoint.meta.v2.pathParameters) {
				for (const name in endpoint.meta.v2.pathParameters) {
					delete infoClone.requestBody.content[requestType].schema.properties[name];
					infoClone.parameters.push({
						name,
						in: 'path',
						schema: schema.properties[name],
						required: true,
					});
				}
			}

			infoClone['operationId'] = endpoint.meta.v2.method.toUpperCase() + '/' + route;
			infoClone['summary'] = endpoint.meta.v2.method.toUpperCase() + ' ' + route;

			spec.paths[route] = {
				...spec.paths[route],
				[endpoint.meta.v2.method]: infoClone,
			};
		}
	}

	return spec;
}
