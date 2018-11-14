import { Parser } from 'acorn';
import * as CanvasConstructor from 'canvas-constructor';
import { default as _fetch } from 'node-fetch';
import { extname } from 'path';
import { URL } from 'url';
import { AlreadyDeclaredIdentifier, CompilationParseError, MissingPropertyError, SandboxError, SandboxPropertyError, UnknownIdentifier } from '../Util/ValidateError';

import * as numericSeparator from 'acorn-numeric-separator';
const parser = Parser.extend(numericSeparator);

const kUnset = Symbol('unset');
const defaultIdentifiers: [string, any][] = Object.entries(CanvasConstructor);

export class InternalError {
	public constructor(public error: Error) {}
}

async function fetch(...args: [string]): Promise<Buffer> {
	if (args.length !== 1) throw new TypeError('Expected only 1 argument (at fetch).');
	if (typeof args[0] !== 'string') throw new TypeError('Expected url to be a string (at fetch).');
	const url = new URL(args[0]);
	const ext = extname(url.pathname);
	if (/^\.(jpe?g|png)$/.test(ext)) {
		const response = await _fetch(url.href);
		if (response.ok) return response.buffer();
		throw new InternalError(new Error(`${response.status}: ${response.statusText} | ${url.href}`));
	}
	throw new InternalError(new Error(`The url ${url.href} must have any of the following extensions: .png, .jpg, .jpeg`));
}

// Function#bind allows the code to be censored
defaultIdentifiers.push(['fetch', fetch.bind(null)]);

// @ts-ignore
defaultIdentifiers.push(['BigInt', BigInt]);
defaultIdentifiers.push(['Number', Number]);
defaultIdentifiers.push(['Error', Error]);
defaultIdentifiers.push(['EvalError', EvalError]);
defaultIdentifiers.push(['RangeError', RangeError]);
defaultIdentifiers.push(['ReferenceError', ReferenceError]);
defaultIdentifiers.push(['SyntaxError', SyntaxError]);
defaultIdentifiers.push(['TypeScript', TypeError]);

export async function evaluate(input: string): Promise<any> {
	try {
		return await parseNode({
			allowSpread: false,
			code: input,
			identifiers: new Map(defaultIdentifiers)
		}, parser.parse(input, {
			// @ts-ignore
			allowAwaitOutsideFunction: true,
			ecmaVersion: 2019
		}), null);
	} catch (error) {
		if (error instanceof InternalError) throw error.error;
		throw error;
	}
}

function parseNode(ctx: EvaluatorContext, node: acorn.Node, scope: Scope): Promise<any> {
	const unknownNode: any = node;
	ctx.allowSpread = false;
	switch (node.type) {
		// case 'ArrowFunctionExpression': return parseArrowFunctionExpression(ctx, unknownNode as NodeArrowFunctionExpression);
		// case 'CatchClause': return parseCatchClause(ctx, unknownNode as NodeCatchClause, scope);
		case 'ArrayExpression': return parseArrayExpression(ctx, unknownNode as NodeArrayExpression, scope);
		case 'AssignmentExpression': return parseAssignmentExpression(ctx, unknownNode as NodeAssignmentExpression, scope);
		case 'AwaitExpression': return parseAwaitExpression(ctx, unknownNode as NodeAwaitExpression, scope);
		case 'BinaryExpression': return parseBinaryExpression(ctx, unknownNode as NodeBinaryExpression, scope);
		case 'BlockStatement': return parseBlockStatement(ctx, unknownNode as NodeBlockStatement, scope);
		case 'CallExpression': return parseCallExpression(ctx, unknownNode as NodeCallExpression, scope);
		case 'ConditionalExpression': return parseConditionalExpression(ctx, unknownNode as NodeConditionalExpression, scope);
		case 'EmptyStatement': return parseEmptyStatement(ctx, unknownNode as NodeEmptyStatement, scope);
		case 'ExpressionStatement': return parseExpressionStatement(ctx, unknownNode as NodeExpressionStatement, scope);
		case 'Identifier': return parseIdentifier(ctx, unknownNode as NodeIdentifier, scope);
		case 'IfStatement': return parseIfStatement(ctx, unknownNode as NodeIfStatement, scope);
		case 'Literal': return parseLiteral(ctx, unknownNode as NodeLiteral);
		case 'MemberExpression': return parseMemberExpression(ctx, unknownNode as NodeMemberExpression, scope);
		case 'NewExpression': return parseNewExpression(ctx, unknownNode as NodeNewExpression, scope);
		case 'ObjectExpression': return parseObjectExpression(ctx, unknownNode as NodeObjectExpression, scope);
		case 'Program': return parseProgram(ctx, unknownNode as NodeProgram, scope);
		case 'SpreadElement': return parseSpreadElement(ctx, unknownNode as NodeSpreadElement, scope);
		case 'TemplateElement': return parseTemplateElement(ctx, unknownNode as NodeTemplateElement, scope);
		case 'TemplateLiteral': return parseTemplateLiteral(ctx, unknownNode as NodeTemplateLiteral, scope);
		case 'ThrowStatement': return parseThrowStatement(ctx, unknownNode as NodeThrowStatement, scope);
		case 'TryStatement': return parseTryStatement(ctx, unknownNode as NodeTryStatement, scope);
		case 'UnaryExpression': return parseUnaryExpression(ctx, unknownNode as NodeUnaryExpression, scope);
		case 'VariableDeclaration': return parseVariableDeclaration(ctx, unknownNode as NodeVariableDeclaration, scope);
		case 'VariableDeclarator': return parseVariableDeclarator(ctx, unknownNode as NodeVariableDeclarator, scope);
		default: throw new CompilationParseError(ctx.code, node.start, 'Unsupported feature');
	}
}

async function parseAwaitExpression(ctx: EvaluatorContext, node: NodeSpreadElement, scope: Scope): Promise<any> {
	return parseNode(ctx, node.argument, scope);
}

async function parseSpreadElement(ctx: EvaluatorContext, node: NodeSpreadElement, scope: Scope): Promise<Iterable<any>> {
	if (!ctx.allowSpread) throw new CompilationParseError(ctx.code, node.argument.start, 'Spread was not expected yet');
	const arg = await parseNode(ctx, node.argument, scope);
	if (Symbol.iterator in arg) return arg;
	throw new CompilationParseError(ctx.code, node.argument.start, 'A iterable was not given');
}

async function parseTemplateElement(_: EvaluatorContext, node: NodeTemplateElement, __: Scope): Promise<string> {
	return node.value.cooked;
}

async function parseTemplateLiteral(ctx: EvaluatorContext, node: NodeTemplateLiteral, scope: Scope): Promise<string> {
	return (await Promise.all(node.expressions.concat(node.quasis)
		.sort((a, b) => a.start - b.start)
		.map((element) => parseNode(ctx, element, scope))))
		.join('');
}

async function parseArrayExpression(ctx: EvaluatorContext, node: NodeArrayExpression, scope: Scope): Promise<Array<any>> {
	const array = [];
	for (const element of node.elements) {
		ctx.allowSpread = true;
		if (element.type === 'SpreadElement') array.push(...await parseSpreadElement(ctx, <unknown> element as NodeSpreadElement, scope));
		else array.push(await parseNode(ctx, element, scope));
	}
	ctx.allowSpread = false;
	return array;
}

async function parseObjectExpression(ctx: EvaluatorContext, node: NodeObjectExpression, scope: Scope): Promise<any> {
	const entries = [];
	for (const property of node.properties) {
		const key = await parseNode(ctx, property.key, scope);
		const value = await parseNode(ctx, property.value, scope);
		entries.push({ [key]: value });
	}
	return Object.seal(Object.assign({}, ...entries));
}

async function parseAssignmentExpression(ctx: EvaluatorContext, node: NodeAssignmentExpression, scope: Scope): Promise<any> {
	const name = (<unknown> node.left as NodeIdentifier).name;
	const type = scope && scope.has(name)
		? ScopeType.Local
		: ctx.identifiers.has(name)
			? ScopeType.Global
			: ScopeType.None;

	if (type === ScopeType.None) throw new UnknownIdentifier(ctx.code, node.start, name);

	const left = await parseNode(ctx, node.left, scope);
	const right = await parseNode(ctx, node.right, scope);
	const operator = binaryOperators.get(node.operator.slice(0, node.operator.length - 1));
	if (operator) {
		const value = operator(left, right);
		if (type === ScopeType.Local) scope.set(name, value);
		else ctx.identifiers.set(name, value);
		return value;
	}
	throw new CompilationParseError(ctx.code, node.left.end, 'Unsupported feature');
}

async function parseProgram(ctx: EvaluatorContext, node: NodeProgram, scope: Scope): Promise<any> {
	let last;
	for (const element of node.body) last = await parseNode(ctx, element, scope);
	return last;
}

async function parseBlockStatement(ctx: EvaluatorContext, node: NodeBlockStatement, scope: Scope): Promise<any> {
	let last;
	for (const element of node.body) last = await parseNode(ctx, element, scope);
	return last;
}

async function parseCallExpression(ctx: EvaluatorContext, node: NodeNewExpression, scope: Scope): Promise<any> {
	const member = await parseNode(ctx, node.callee, scope);
	if (typeof member !== 'function') throw new CompilationParseError(ctx.code, node.callee.start, 'Tried to call a non-function');
	const args = await Promise.all(node.arguments.map((arg) => parseNode(ctx, arg, scope)));
	return member(...args);
}

async function parseCatchClause(ctx: EvaluatorContext, node: NodeCatchClause, scope: Scope, error: Error): Promise<any> {
	const internalScope = node.param ? (scope ? new Map([...scope]) : new Map()).set(node.param.name, error) : scope;
	const internalBlock = await parseBlockStatement(ctx, node.body, internalScope);
	if (node.param && scope) scope.delete(node.param.name);
	return internalBlock;
}

async function parseConditionalExpression(ctx: EvaluatorContext, node: NodeConditionalExpression, scope: Scope): Promise<any> {
	const test = await parseNode(ctx, node.test, scope);
	return parseNode(ctx, test ? node.consequent : node.alternate, scope);
}

async function parseNewExpression(ctx: EvaluatorContext, node: NodeNewExpression, scope: Scope): Promise<any> {
	const ctor: new (...args: any[]) => any = await parseNode(ctx, node.callee, scope);
	if (typeof ctor !== 'function') throw new CompilationParseError(ctx.code, node.callee.start, 'Constructor is not a function');
	const args = await Promise.all(node.arguments.map((arg) => parseNode(ctx, arg, scope)));
	return new ctor(...args);
}

async function parseEmptyStatement(_: EvaluatorContext, __: NodeEmptyStatement, ___: Scope): Promise<any> {
	return undefined;
}

function parseExpressionStatement(ctx: EvaluatorContext, node: NodeExpressionStatement, scope: Scope): Promise<any> {
	return parseNode(ctx, node.expression, scope);
}

async function parseMemberExpression(ctx: EvaluatorContext, node: NodeMemberExpression, scope: Scope): Promise<string> {
	const object = await parseNode(ctx, node.object, scope);
	const propertyValue = node.property.type === 'Identifier' ? (<NodeIdentifier> node.property).name : await parseNode(ctx, node.property, scope);
	let property: any = kUnset;

	if (node.computed && node.property.type !== 'Literal') {
		// If `[variable]()`
		if (ctx.identifiers.has(propertyValue)) property = ctx.identifiers.get(propertyValue);
		else if (scope && scope.has(propertyValue)) property = scope.get(propertyValue);
		if (property === kUnset) throw new UnknownIdentifier(ctx.code, node.property.start, propertyValue);
	} else {
		// If .variable
		property = propertyValue;
	}

	if (property === 'constructor') throw new SandboxPropertyError(ctx.code, node.property.start, 'constructor');
	if (!(property in object)) throw new InternalError(new MissingPropertyError(ctx.code, node.property.start, property));

	const value = object[property];
	return typeof value === 'function' ? value.bind(object) : value;
}

async function parseVariableDeclaration(ctx: EvaluatorContext, node: NodeVariableDeclaration, scope: Scope): Promise<any> {
	for (const declarator of node.declarations) await parseVariableDeclarator(ctx, declarator, scope);
}

async function parseVariableDeclarator(ctx: EvaluatorContext, node: NodeVariableDeclarator, scope: Scope): Promise<any> {
	if (ctx.identifiers.has(node.id.name) || scope && scope.has(node.id.name)) throw new AlreadyDeclaredIdentifier(ctx.code, node.id.start, node.id.name);
	const value = node.init ? await parseNode(ctx, node.init, scope) : undefined;
	if (scope) scope.set(node.id.name, value);
	else ctx.identifiers.set(node.id.name, value);
}

// function parseArrowFunctionExpression(ctx: EvaluatorContext, node: NodeArrowFunctionExpression, scope: Scope): Function {
// 	return (): null => null;
// }

async function parseThrowStatement(ctx: EvaluatorContext, node: NodeThrowStatement, scope: Scope): Promise<any> {
	throw new InternalError(await parseNode(ctx, node.argument, scope));
}

async function parseTryStatement(ctx: EvaluatorContext, node: NodeTryStatement, scope: Scope): Promise<any> {
	try {
		const internalBlock = await parseBlockStatement(ctx, node.block, scope);
		return internalBlock;
	} catch (error) {
		if (error instanceof InternalError && node.handler) {
			const internalCatch = await parseCatchClause(ctx, node.handler, scope, error.error);
			return internalCatch;
		}
		throw error;
	} finally {
		if (node.finalizer) await parseBlockStatement(ctx, node.finalizer, scope);
	}
}

async function parseUnaryExpression(ctx: EvaluatorContext, node: NodeUnaryExpression, scope: Scope): Promise<any> {
	const argument = await parseNode(ctx, node.argument, scope);
	const operator = unaryOperators.get(node.operator);
	if (operator) return operator(argument);
	throw new CompilationParseError(ctx.code, node.argument.end, 'Unsupported feature');
}

async function parseBinaryExpression(ctx: EvaluatorContext, node: NodeBinaryExpression, scope: Scope): Promise<any> {
	const left = await parseNode(ctx, node.left, scope);
	const right = await parseNode(ctx, node.right, scope);
	const operator = binaryOperators.get(node.operator);
	if (operator) return operator(left, right);
	throw new CompilationParseError(ctx.code, node.left.end, 'Unsupported feature');
}

async function parseIdentifier(ctx: EvaluatorContext, node: NodeIdentifier, scope: Scope): Promise<any> {
	if (ctx.identifiers.has(node.name)) return ctx.identifiers.get(node.name);
	if (scope && scope.has(node.name)) return scope.get(node.name);
	throw new UnknownIdentifier(ctx.code, node.start, node.name);
}

async function parseIfStatement(ctx: EvaluatorContext, node: NodeIfStatement, scope: Scope): Promise<any> {
	const test = await parseNode(ctx, node.test, scope);
	if (test) return parseNode(ctx, node.consequent, scope);
	if (node.alternate) return parseNode(ctx, node.alternate, scope);
	return undefined;
}

function parseLiteral(ctx: EvaluatorContext, node: NodeLiteral): Promise<any> {
	if (node.value instanceof RegExp) throw new SandboxError(ctx.code, node.start, 'RegExp is not available');
	return node.value;
}

const binaryOperators: Map<string, (left: any, right: any) => any> = new Map()
	// Math operators
	.set('+', (left: any, right: any) => left + right)
	.set('-', (left: any, right: any) => left - right)
	.set('/', (left: any, right: any) => left / right)
	.set('*', (left: any, right: any) => left * right)
	.set('%', (left: any, right: any) => left % right)

	// Boolean operators
	.set('**', (left: any, right: any) => left ** right)
	.set('&&', (left: any, right: any) => left && right)
	.set('||', (left: any, right: any) => left || right)

	// Equality operators
	.set('==', (left: any, right: any) => left == right) // tslint:disable-line
	.set('===', (left: any, right: any) => left === right)
	.set('!=', (left: any, right: any) => left != right) // tslint:disable-line
	.set('!==', (left: any, right: any) => left !== right)
	.set('>', (left: any, right: any) => left > right)
	.set('<', (left: any, right: any) => left < right)
	.set('>=', (left: any, right: any) => left >= right)
	.set('<=', (left: any, right: any) => left <= right)

	// Bitwise operators
	.set('^', (left: any, right: any) => left ^ right)
	.set('&', (left: any, right: any) => left & right)
	.set('|', (left: any, right: any) => left | right)
	.set('>>', (left: any, right: any) => left >> right)
	.set('<<', (left: any, right: any) => left << right)
	.set('>>>', (left: any, right: any) => left >>> right)

	// Object operators
	.set('in', (left: any, right: any) => left in right);

const unaryOperators: Map<string, (value: any) => any> = new Map()
	// Bitwise operators
	.set('~', (value: any) => ~value)

	// Boolean operators
	.set('!', (value: any) => !value);

/**
 * The scope type for a variable
 */
enum ScopeType {
	/**
	 * The global scope, used if the value is in the global scope
	 */
	Global,
	/**
	 * The local scope, used if the value is in the local scope
	 */
	Local,
	/**
	 * No scope, the variable does not exist
	 */
	None
}

/**
 * Scope
 */
type Scope = Map<string, any> | null;

/**
 * Evaluator context
 */
type EvaluatorContext = {
	allowSpread: boolean;
	code: string;
	identifiers: Map<string, any>;
};

/**
 * Program type
 */
type NodeProgram = acorn.Node & {
	body: acorn.Node[];
};

/**
 * MemberExpression type
 */
type NodeMemberExpression = acorn.Node & {
	object: acorn.Node;
	property: acorn.Node;
	computed: boolean;
};

/**
 * VariableDeclaration type
 */
type NodeVariableDeclaration = acorn.Node & {
	property: NodeIdentifier;
	kind: 'var' | 'let' | 'const';
	declarations: NodeVariableDeclarator[];
};

/**
 * ObjectExpression type
 */
type NodeObjectExpression = acorn.Node & {
	properties: NodeProperty[];
};

/**
 * Property type
 */
type NodeProperty = acorn.Node & {
	method: boolean;
	shorthand: boolean;
	computed: boolean;
	key: acorn.Node;
	value: acorn.Node;
	kind: string;
};

/**
 * VariableDeclarator type
 */
type NodeVariableDeclarator = acorn.Node & {
	id: NodeIdentifier;
	init: acorn.Node | null;
};

/**
 * BlockStatement type
 */
type NodeBlockStatement = acorn.Node & {
	body: acorn.Node[];
};

/**
 * CallExpression type
 */
type NodeCallExpression = acorn.Node & {
	callee: acorn.Node;
	arguments: acorn.Node[];
};

/**
 * Literal type
 */
type NodeLiteral = acorn.Node & {
	value: any;
	raw: string;
};

/**
 * Identifier type
 */
type NodeIdentifier = acorn.Node & {
	name: string;
};

/**
 * IfStatement type
 */
type NodeIfStatement = acorn.Node & {
	test: acorn.Node;
	consequent: acorn.Node;
	alternate: acorn.Node | null;
};

/**
 * ArrayExpression type
 */
type NodeArrayExpression = acorn.Node & {
	elements: acorn.Node[];
};

/**
 * SpreadElement type
 */
type NodeSpreadElement = acorn.Node & {
	argument: acorn.Node;
};

/**
 * ConditionalExpression type
 */
type NodeConditionalExpression = acorn.Node & {
	test: acorn.Node;
	consequent: acorn.Node;
	alternate: acorn.Node;
};

/**
 * BinaryExpression type
 */
type NodeBinaryExpression = acorn.Node & {
	left: acorn.Node;
	right: acorn.Node;
	operator: string;
};

/**
 * NewExpression type
 */
type NodeNewExpression = acorn.Node & {
	callee: acorn.Node;
	arguments: acorn.Node[];
};

/**
 * EmptyStatement type
 */
type NodeEmptyStatement = acorn.Node;

/**
 * ExpressionStatement type
 */
type NodeExpressionStatement = acorn.Node & {
	expression: acorn.Node;
};

/**
 * TemplateLiteral type
 */
type NodeTemplateLiteral = acorn.Node & {
	expressions: acorn.Node[];
	quasis: NodeTemplateElement[];
};

/**
 * ThrowStatement type
 */
type NodeThrowStatement = acorn.Node & {
	argument: acorn.Node;
};

/**
 * TryStatement type
 */
type NodeTryStatement = acorn.Node & {
	block: NodeBlockStatement;
	handler: NodeCatchClause;
	finalizer: NodeBlockStatement;
};

/**
 * CatchClause type
 */
type NodeCatchClause = acorn.Node & {
	param: NodeIdentifier;
	body: NodeBlockStatement;
};

/**
 * TemplateElement type
 */
type NodeTemplateElement = acorn.Node & {
	value: {
		raw: string;
		cooked: string;
	};
	tail: boolean;
};

/**
 * UnaryExpression type
 */
type NodeUnaryExpression = acorn.Node & {
	operator: string;
	prefix: boolean;
	argument: acorn.Node;
};

/**
 * AwaitExpression type
 */
type NodeAwaitExpression = acorn.Node & {
	argument: acorn.Node;
};

/**
 * AssignmentExpression type
 */
type NodeAssignmentExpression = acorn.Node & {
	operator: string;
	left: acorn.Node;
	right: acorn.Node;
};

// TODO: Add this later
// type NodeArrowFunctionExpression = acorn.Node & {
// 	id: acorn.Node & { name: string };
// 	expression: boolean;
// 	generator: boolean;
// 	async: boolean;
// 	params: NodeIdentifier[];
// 	body: acorn.Node;
// };
