const dbFunctions = ["find", "findBy", "findOne", "findOneBy", "findOneOrFail", "findOneByOrFail", "getOne", "getMany", "getRawOne", "getRawMany"];

module.exports = {
	meta: {
		type: "suggestion",
	},
	create(context) {
		return {
			"Program:exit"(programNode) {
				const isNull = (node) => node.type === "Literal" && node.value === null;

				const scopes = [context.getScope()];
				while (scopes.length > 0) {
					const s = scopes.pop();
					s.childScopes.forEach(x => scopes.push(x));

					const variables = s.variables
						.filter(x =>
							x.references
								.filter((ref) => ref.isRead())
								.length > 0
							&& x.defs.length > 0
						);

					for (const v of variables) {
						let findValueAssign = null;
						// if the find value was not read, there will already be an unused variable lint
						// or maybe this was inside an if/else so we dont want to cause a false positive
						let read = false;
						for (const ref of v.references) {
							if (
								ref.isWrite()
							) {
								if (!ref.writeExpr) continue;
								let writeExpr = ref.writeExpr;
								// unwrap write expression, order matters to correctly unwrap
								// something like "await Promise.all([a, b])".
								// Basically a poor mans data flow analysis.
								if (writeExpr.type === "AwaitExpression")
									writeExpr = writeExpr.argument;
								if (
									writeExpr.type === "CallExpression"
									&& writeExpr.callee.type === "MemberExpression"
									&& writeExpr.callee.object.type === "Identifier"
									&& writeExpr.callee.object.name === "Promise"
									&& writeExpr.callee.property.type === "Identifier"
									&& writeExpr.callee.property.name === "all"
								)
									writeExpr = writeExpr.arguments[0];
								if (
									writeExpr.type === "ArrayExpression"
									&& ref.identifier.parent.type === "ArrayPattern"
								) {
									// use same index as the index of the identifier in the array pattern
									const index = ref.identifier.parent.elements.indexOf(ref.identifier);
									if (index > -1)
										writeExpr = writeExpr.elements[index];
								}
								// check if this is a DB find thingy
								if (
									writeExpr.type === "CallExpression"
									&& writeExpr.callee.type === "MemberExpression"
									&& writeExpr.callee.property.type === "Identifier"
									&& dbFunctions.includes(writeExpr.callee.property.name)
								) {
									if (findValueAssign && read) {
										context.report({
											node: findValueAssign,
											message: "The returned object(s) are not read from, use `count` or `countBy` instead."
										});
									}
									findValueAssign = writeExpr;
									read = false;
								}
							}
							// must be a read
							else if (findValueAssign) {
								const node = ref.identifier;
								if(!(
									(
										// explicit null check
										node.parent.type === "BinaryExpression" &&
										["==", "===", "!=", "!=="].includes(node.parent.operator) &&
										(
											(isNull(node.parent.left) && node.parent.right === node)
											||
											(isNull(node.parent.right) && node.parent.left === node)
										)
									) || (
										// implicit null check
										["IfStatement", "ConditionalExpression"].includes(node.parent.type)
									) || (
										// different implicit null check
										node.parent.type === "UnaryExpression" &&
										node.parent.operator === "!"
									) || (
										// length check
										node.parent.type === "MemberExpression" &&
										node.parent.object === node &&
										node.parent.property.type === "Identifier" &&
										node.parent.property.name === "length"
									)
								)) {
									// other use, dont report
									findValueAssign = null;
								}
							}
						}
						if (findValueAssign) {
							context.report({
								node: findValueAssign,
								message: "The returned object(s) are not read from, use `count` or `countBy` instead."
							});
						}
					}
				}
			}
		};
	}
};
