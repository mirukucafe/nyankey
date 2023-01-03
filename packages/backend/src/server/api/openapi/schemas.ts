import { refs, Schema } from '@/misc/schema.js';

export function convertSchemaToOpenApiSchema(schema: Schema) {
	const res: any = schema;

	if (schema.type === 'object' && schema.properties) {
		res.required = Object.entries(schema.properties)
			.flatMap(([k, v]) => v.optional ? [] : [k]);

		for (const k of Object.keys(schema.properties)) {
			res.properties[k] = convertSchemaToOpenApiSchema(schema.properties[k]);
		}
	}

	if (schema.type === 'array' && schema.items) {
		res.items = convertSchemaToOpenApiSchema(schema.items);
	}

	if (schema.anyOf) res.anyOf = schema.anyOf.map(convertSchemaToOpenApiSchema);
	if (schema.oneOf) res.oneOf = schema.oneOf.map(convertSchemaToOpenApiSchema);
	if (schema.allOf) res.allOf = schema.allOf.map(convertSchemaToOpenApiSchema);

	if (schema.ref) {
		res.$ref = `#/components/schemas/${schema.ref}`;
	}

	return res;
}

export const schemas = {
	Error: {
		type: 'object',
		properties: {
			error: {
				type: 'object',
				description: 'An error object.',
				properties: {
					code: {
						type: 'string',
						description: 'A machine and human readable error code.',
					},
					endpoint: {
						type: 'string',
						description: 'Name of the API endpoint the error happened in.',
					},
					message: {
						type: 'string',
						description: 'A human readable error description in English.',
					},
					info: {
						description: 'Potentially more information, primarily intended for developers.',
					},
				},
				required: ['code', 'endpoint', 'message'],
			},
		},
		required: ['error'],
	},

	...Object.fromEntries(
		Object.entries(refs).map(([key, schema]) => [key, convertSchemaToOpenApiSchema(schema)]),
	),
};
