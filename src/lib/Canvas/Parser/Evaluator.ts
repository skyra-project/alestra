/* eslint-disable func-call-spacing */
import {
	AlreadyDeclaredIdentifier,
	CompilationParseError,
	MissingPropertyError,
	SandboxError,
	SandboxPropertyError,
	UnknownIdentifier
} from '@lib/Canvas/Util/ValidateError';
import { Parser } from 'acorn';
import { Image, loadImage } from 'canvas';
import * as CanvasConstructor from 'canvas-constructor';
import { default as _fetch } from 'node-fetch';
import { extname } from 'path';
import { URL } from 'url';

function* filter<T>(object: Record<string, T>, keys: readonly string[]) {
	for (const [key, value] of Object.entries<T>(object)) {
		if (keys.includes(key)) continue;
		yield [key, value] as [string, T];
	}
}

const kUnset = Symbol('unset');
const defaultIdentifiers: [string, unknown][] = [
	// Function#bind allows the code to be censored
	['fetch', fetch.bind(null)],
	...Object.entries({
		undefined,
		Infinity,
		NaN,
		isFinite,
		isNaN,
		parseFloat,
		parseInt,
		decodeURI,
		decodeURIComponent,
		encodeURI,
		encodeURIComponent,
		Boolean,
		Number,
		Symbol,
		Object,
		Array,
		Int8Array,
		Uint8Array,
		Uint8ClampedArray,
		Int16Array,
		Uint16Array,
		Int32Array,
		Uint32Array,
		Float32Array,
		Float64Array,
		ArrayBuffer,
		DataView,
		JSON,
		Reflect,
		Map,
		WeakMap,
		Set,
		WeakSet,
		Promise,
		Proxy,
		Math,
		Date,
		Error,
		EvalError,
		RangeError,
		ReferenceError,
		SyntaxError,
		TypeError
	}),
	...filter(CanvasConstructor, ['resolveImage'])
];

const binaryOperators = new Map<string, (left: any, right: any) => unknown>()
	// Math operators
	.set('+', (left: number, right: number) => left + right) // eslint-disable-line @typescript-eslint/restrict-plus-operands
	.set('-', (left: number, right: number) => left - right)
	.set('/', (left: number, right: number) => left / right)
	.set('*', (left: number, right: number) => left * right)
	.set('%', (left: number, right: number) => left % right)
	.set('**', (left: number, right: number) => left ** right)

	// Boolean operators
	.set('&&', (left: number, right: number) => left && right)
	.set('||', (left: number, right: number) => left || right)

	// Equality operators
	.set('==', (left: number, right: number) => left == right) // eslint-disable-line eqeqeq
	.set('===', (left: number, right: number) => left === right)
	.set('!=', (left: number, right: number) => left != right) // eslint-disable-line eqeqeq
	.set('!==', (left: number, right: number) => left !== right)
	.set('>', (left: number, right: number) => left > right)
	.set('<', (left: number, right: number) => left < right)
	.set('>=', (left: number, right: number) => left >= right)
	.set('<=', (left: number, right: number) => left <= right)

	// Bitwise operators
	.set('^', (left: number, right: number) => left ^ right)
	.set('&', (left: number, right: number) => left & right)
	.set('|', (left: number, right: number) => left | right)
	.set('>>', (left: number, right: number) => left >> right)
	.set('<<', (left: number, right: number) => left << right)
	.set('>>>', (left: number, right: number) => left >>> right)

	// Object operators
	.set('in', (left: string | number | symbol, right: Record<PropertyKey, unknown>) => left in right);

const unaryOperators = new Map<string, (value: any) => unknown>()
	// Math operators
	.set('+', (value: number) => +value) // eslint-disable-line no-implicit-coercion
	.set('-', (value: number) => -value)
	// Bitwise operators
	.set('~', (value: number) => ~value)

	// Boolean operators
	.set('!', (value: unknown) => !value)

	// Object operators
	.set('typeof', (value: unknown) => typeof value);

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

export class InternalError {
	public error: Error;
	public constructor(error: Error) {
		this.error = error;
	}
}

async function fetch(...args: [string]): Promise<Image> {
	if (args.length !== 1) throw new TypeError('Expected only 1 argument (at fetch).');
	if (typeof args[0] !== 'string') throw new TypeError('Expected url to be a string (at fetch).');
	const url = new URL(args[0]);
	const ext = extname(url.pathname);
	if (/^\.(jpe?g|png)$/.test(ext)) {
		const response = await _fetch(url.href);
		if (response.ok) return loadImage(await response.buffer());
		throw new InternalError(new Error(`${response.status}: ${response.statusText} | ${url.href}`));
	}
	throw new InternalError(new Error(`The url ${url.href} must have unknown of the following extensions: .png, .jpg, .jpeg`));
}

export async function evaluate(input: string, extraVariables: [string, unknown][] = []): Promise<unknown> {
	try {
		return await parseNode(
			{
				allowSpread: false,
				code: input,
				identifiers: new Map(defaultIdentifiers.concat(extraVariables))
			},
			Parser.parse(input, {
				allowAwaitOutsideFunction: true,
				ecmaVersion: 2019
			}),
			null
		);
	} catch (error) {
		if (error instanceof InternalError) throw error.error;
		throw error;
	}
}

async function parseNode(ctx: EvaluatorContext, node: acorn.Node, scope: Scope): Promise<unknown> {
	const unknownNode: unknown = node;
	ctx.allowSpread = false;
	switch (node.type) {
		// case 'ArrowFunctionExpression': return parseArrowFunctionExpression(ctx, unknownNode as NodeArrowFunctionExpression);
		// case 'CatchClause': return parseCatchClause(ctx, unknownNode as NodeCatchClause, scope);
		case 'ArrayExpression':
			return parseArrayExpression(ctx, unknownNode as NodeArrayExpression, scope);
		case 'AssignmentExpression':
			return parseAssignmentExpression(ctx, unknownNode as NodeAssignmentExpression, scope);
		case 'AwaitExpression':
			return parseAwaitExpression(ctx, unknownNode as NodeAwaitExpression, scope);
		case 'BinaryExpression':
			return parseBinaryExpression(ctx, unknownNode as NodeBinaryExpression, scope);
		case 'BlockStatement':
			return parseBlockStatement(ctx, unknownNode as NodeBlockStatement, scope);
		case 'CallExpression':
			return parseCallExpression(ctx, unknownNode as NodeCallExpression, scope);
		case 'ConditionalExpression':
			return parseConditionalExpression(ctx, unknownNode as NodeConditionalExpression, scope);
		case 'EmptyStatement':
			return parseEmptyStatement();
		case 'ExpressionStatement':
			return parseExpressionStatement(ctx, unknownNode as NodeExpressionStatement, scope);
		case 'Identifier':
			return parseIdentifier(ctx, unknownNode as NodeIdentifier, scope);
		case 'IfStatement':
			return parseIfStatement(ctx, unknownNode as NodeIfStatement, scope);
		case 'Literal':
			return parseLiteral(ctx, unknownNode as NodeLiteral);
		case 'MemberExpression':
			return parseMemberExpression(ctx, unknownNode as NodeMemberExpression, scope);
		case 'NewExpression':
			return parseNewExpression(ctx, unknownNode as NodeNewExpression, scope);
		case 'ObjectExpression':
			return parseObjectExpression(ctx, unknownNode as NodeObjectExpression, scope);
		case 'Program':
			return parseProgram(ctx, unknownNode as NodeProgram, scope);
		case 'SpreadElement':
			return parseSpreadElement(ctx, unknownNode as NodeSpreadElement, scope);
		case 'TemplateElement':
			return parseTemplateElement(ctx, unknownNode as NodeTemplateElement);
		case 'TemplateLiteral':
			return parseTemplateLiteral(ctx, unknownNode as NodeTemplateLiteral, scope);
		case 'ThrowStatement':
			return parseThrowStatement(ctx, unknownNode as NodeThrowStatement, scope);
		case 'TryStatement':
			return parseTryStatement(ctx, unknownNode as NodeTryStatement, scope);
		case 'UnaryExpression':
			return parseUnaryExpression(ctx, unknownNode as NodeUnaryExpression, scope);
		case 'VariableDeclaration':
			return parseVariableDeclaration(ctx, unknownNode as NodeVariableDeclaration, scope);
		case 'VariableDeclarator':
			return parseVariableDeclarator(ctx, unknownNode as NodeVariableDeclarator, scope);
		default:
			throw new CompilationParseError(ctx.code, node.start, 'Unsupported feature');
	}
}

async function parseAwaitExpression(ctx: EvaluatorContext, node: NodeSpreadElement, scope: Scope): Promise<unknown> {
	return parseNode(ctx, node.argument, scope);
}

async function parseSpreadElement(ctx: EvaluatorContext, node: NodeSpreadElement, scope: Scope): Promise<Iterable<unknown>> {
	if (!ctx.allowSpread) throw new CompilationParseError(ctx.code, node.argument.start, 'Spread was not expected yet');
	const arg = await parseNode(ctx, node.argument, scope);
	if (Symbol.iterator in Object(arg)) return arg as Iterable<unknown>;
	throw new CompilationParseError(ctx.code, node.argument.start, 'A iterable was not given');
}

function parseTemplateElement(_: EvaluatorContext, node: NodeTemplateElement): string {
	return node.value.cooked;
}

async function parseTemplateLiteral(ctx: EvaluatorContext, node: NodeTemplateLiteral, scope: Scope): Promise<string> {
	return (
		await Promise.all(
			node.expressions
				.concat(node.quasis)
				.sort((a, b) => a.start - b.start)
				.map((element) => parseNode(ctx, element, scope))
		)
	).join('');
}

async function parseArrayExpression(ctx: EvaluatorContext, node: NodeArrayExpression, scope: Scope): Promise<Array<unknown>> {
	const array: unknown[] = [];
	for (const element of node.elements) {
		ctx.allowSpread = true;
		if (element.type === 'SpreadElement') array.push(...(await parseSpreadElement(ctx, element as NodeSpreadElement, scope)));
		else array.push(await parseNode(ctx, element, scope));
	}
	ctx.allowSpread = false;
	return array;
}

async function parseObjectExpression(ctx: EvaluatorContext, node: NodeObjectExpression, scope: Scope): Promise<unknown> {
	const entries: Record<string, unknown>[] = [];
	for (const property of node.properties) {
		const key = (await parseNode(ctx, property.key, scope)) as PropertyKey;
		const value = await parseNode(ctx, property.value, scope);
		entries.push({ [key]: value });
	}
	return Object.seal(Object.assign({}, ...entries)) as unknown;
}

async function parseAssignmentExpression(ctx: EvaluatorContext, node: NodeAssignmentExpression, scope: Scope): Promise<unknown> {
	const { name } = node.left as NodeIdentifier;
	const type = scope && scope.has(name) ? ScopeType.Local : ctx.identifiers.has(name) ? ScopeType.Global : ScopeType.None;

	if (type === ScopeType.None) throw new UnknownIdentifier(ctx.code, node.start, name);

	const left = await parseNode(ctx, node.left, scope);
	const right = await parseNode(ctx, node.right, scope);
	const operator = binaryOperators.get(node.operator.slice(0, node.operator.length - 1));
	if (operator) {
		const value = operator(left, right);
		if (type === ScopeType.Local) scope!.set(name, value);
		else ctx.identifiers.set(name, value);
		return value;
	}
	throw new CompilationParseError(ctx.code, node.left.end, 'Unsupported feature');
}

async function parseProgram(ctx: EvaluatorContext, node: NodeProgram, scope: Scope): Promise<unknown> {
	let last: unknown = null;
	for (const element of node.body) last = await parseNode(ctx, element, scope);
	return last;
}

async function parseBlockStatement(ctx: EvaluatorContext, node: NodeBlockStatement, scope: Scope): Promise<unknown> {
	let last: unknown = null;
	for (const element of node.body) last = await parseNode(ctx, element, scope);
	return last;
}

async function parseCallExpression(ctx: EvaluatorContext, node: NodeNewExpression, scope: Scope): Promise<unknown> {
	const member = await parseNode(ctx, node.callee, scope);
	if (typeof member !== 'function') throw new CompilationParseError(ctx.code, node.callee.start, 'Tried to call a non-function');
	const args = await Promise.all(node.arguments.map((arg) => parseNode(ctx, arg, scope)));
	return member(...args) as unknown;
}

async function parseCatchClause(ctx: EvaluatorContext, node: NodeCatchClause, scope: Scope, error: Error): Promise<unknown> {
	const internalScope = node.param ? (scope ? new Map([...scope]) : new Map()).set(node.param.name, error) : scope;
	const internalBlock = await parseBlockStatement(ctx, node.body, internalScope);
	if (node.param && scope) scope.delete(node.param.name);
	return internalBlock;
}

async function parseConditionalExpression(ctx: EvaluatorContext, node: NodeConditionalExpression, scope: Scope): Promise<unknown> {
	const test = await parseNode(ctx, node.test, scope);
	return parseNode(ctx, test ? node.consequent : node.alternate, scope);
}

async function parseNewExpression(ctx: EvaluatorContext, node: NodeNewExpression, scope: Scope): Promise<unknown> {
	const ctor = (await parseNode(ctx, node.callee, scope)) as new (...args: unknown[]) => unknown;
	if (typeof ctor !== 'function') throw new CompilationParseError(ctx.code, node.callee.start, 'Constructor is not a function');
	const args = await Promise.all(node.arguments.map((arg) => parseNode(ctx, arg, scope)));
	return new ctor(...args);
}

function parseEmptyStatement(): unknown {
	return undefined;
}

function parseExpressionStatement(ctx: EvaluatorContext, node: NodeExpressionStatement, scope: Scope): Promise<unknown> {
	return parseNode(ctx, node.expression, scope);
}

async function parseMemberExpression(ctx: EvaluatorContext, node: NodeMemberExpression, scope: Scope): Promise<unknown> {
	const object = await parseNode(ctx, node.object, scope);
	const propertyValue = (
		node.property.type === 'Identifier' ? (node.property as NodeIdentifier).name : await parseNode(ctx, node.property, scope)
	) as string;
	let property: unknown = kUnset;

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

	const O = Object(object) as Record<PropertyKey, unknown>;
	const K = property as string;
	if (!Reflect.has(O, K)) throw new InternalError(new MissingPropertyError(ctx.code, node.property.start, K));

	const value = Reflect.get(O, K) as unknown;
	return typeof value === 'function' ? (value.bind(object) as unknown) : value;
}

async function parseVariableDeclaration(ctx: EvaluatorContext, node: NodeVariableDeclaration, scope: Scope) {
	for (const declarator of node.declarations) await parseVariableDeclarator(ctx, declarator, scope);
}

async function parseVariableDeclarator(ctx: EvaluatorContext, node: NodeVariableDeclarator, scope: Scope) {
	if (ctx.identifiers.has(node.id.name) || (scope && scope.has(node.id.name)))
		throw new AlreadyDeclaredIdentifier(ctx.code, node.id.start, node.id.name);
	const value = node.init ? await parseNode(ctx, node.init, scope) : undefined;
	if (scope) scope.set(node.id.name, value);
	else ctx.identifiers.set(node.id.name, value);
}

// function parseArrowFunctionExpression(ctx: EvaluatorContext, node: NodeArrowFunctionExpression, scope: Scope): Function {
// 	return (): null => null;
// }

async function parseThrowStatement(ctx: EvaluatorContext, node: NodeThrowStatement, scope: Scope) {
	throw new InternalError((await parseNode(ctx, node.argument, scope)) as Error);
}

async function parseTryStatement(ctx: EvaluatorContext, node: NodeTryStatement, scope: Scope) {
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

async function parseUnaryExpression(ctx: EvaluatorContext, node: NodeUnaryExpression, scope: Scope) {
	const argument = await parseNode(ctx, node.argument, scope);
	const operator = unaryOperators.get(node.operator);
	if (operator) return operator(argument);
	throw new CompilationParseError(ctx.code, node.argument.end, 'Unsupported feature');
}

async function parseBinaryExpression(ctx: EvaluatorContext, node: NodeBinaryExpression, scope: Scope) {
	const left = await parseNode(ctx, node.left, scope);
	const right = await parseNode(ctx, node.right, scope);
	const operator = binaryOperators.get(node.operator);
	if (operator) return operator(left, right);
	throw new CompilationParseError(ctx.code, node.left.end, 'Unsupported feature');
}

function parseIdentifier(ctx: EvaluatorContext, node: NodeIdentifier, scope: Scope) {
	if (ctx.identifiers.has(node.name)) return ctx.identifiers.get(node.name);
	if (scope && scope.has(node.name)) return scope.get(node.name);
	throw new UnknownIdentifier(ctx.code, node.start, node.name);
}

async function parseIfStatement(ctx: EvaluatorContext, node: NodeIfStatement, scope: Scope): Promise<unknown> {
	const test = await parseNode(ctx, node.test, scope);
	if (test) return parseNode(ctx, node.consequent, scope);
	if (node.alternate) return parseNode(ctx, node.alternate, scope);
	return undefined;
}

function parseLiteral(ctx: EvaluatorContext, node: NodeLiteral) {
	if (node.value instanceof RegExp) throw new SandboxError(ctx.code, node.start, 'RegExp is not available');
	return node.value;
}

/**
 * Scope
 */
type Scope = Map<string, unknown> | null;

/**
 * Evaluator context
 */
interface EvaluatorContext {
	allowSpread: boolean;
	code: string;
	identifiers: Map<string, unknown>;
}

/**
 * Program type
 */
interface NodeProgram extends acorn.Node {
	body: acorn.Node[];
}

/**
 * MemberExpression type
 */
interface NodeMemberExpression extends acorn.Node {
	object: acorn.Node;
	property: acorn.Node;
	computed: boolean;
}

/**
 * VariableDeclaration type
 */
interface NodeVariableDeclaration extends acorn.Node {
	property: NodeIdentifier;
	kind: 'var' | 'let' | 'const';
	declarations: NodeVariableDeclarator[];
}

/**
 * ObjectExpression type
 */
interface NodeObjectExpression extends acorn.Node {
	properties: NodeProperty[];
}

/**
 * Property type
 */
interface NodeProperty extends acorn.Node {
	method: boolean;
	shorthand: boolean;
	computed: boolean;
	key: acorn.Node;
	value: acorn.Node;
	kind: string;
}

/**
 * VariableDeclarator type
 */
interface NodeVariableDeclarator extends acorn.Node {
	id: NodeIdentifier;
	init: acorn.Node | null;
}

/**
 * BlockStatement type
 */
interface NodeBlockStatement extends acorn.Node {
	body: acorn.Node[];
}

/**
 * CallExpression type
 */
interface NodeCallExpression extends acorn.Node {
	callee: acorn.Node;
	arguments: acorn.Node[];
}

/**
 * Literal type
 */
interface NodeLiteral extends acorn.Node {
	value: unknown;
	raw: string;
}

/**
 * Identifier type
 */
interface NodeIdentifier extends acorn.Node {
	name: string;
}

/**
 * IfStatement type
 */
interface NodeIfStatement extends acorn.Node {
	test: acorn.Node;
	consequent: acorn.Node;
	alternate: acorn.Node | null;
}

/**
 * ArrayExpression type
 */
interface NodeArrayExpression extends acorn.Node {
	elements: acorn.Node[];
}

/**
 * SpreadElement type
 */
interface NodeSpreadElement extends acorn.Node {
	argument: acorn.Node;
}

/**
 * ConditionalExpression type
 */
interface NodeConditionalExpression extends acorn.Node {
	test: acorn.Node;
	consequent: acorn.Node;
	alternate: acorn.Node;
}

/**
 * BinaryExpression type
 */
interface NodeBinaryExpression extends acorn.Node {
	left: acorn.Node;
	right: acorn.Node;
	operator: string;
}

/**
 * NewExpression type
 */
interface NodeNewExpression extends acorn.Node {
	callee: acorn.Node;
	arguments: acorn.Node[];
}

/**
 * ExpressionStatement type
 */
interface NodeExpressionStatement extends acorn.Node {
	expression: acorn.Node;
}

/**
 * TemplateLiteral type
 */
interface NodeTemplateLiteral extends acorn.Node {
	expressions: acorn.Node[];
	quasis: NodeTemplateElement[];
}

/**
 * ThrowStatement type
 */
interface NodeThrowStatement extends acorn.Node {
	argument: acorn.Node;
}

/**
 * TryStatement type
 */
interface NodeTryStatement extends acorn.Node {
	block: NodeBlockStatement;
	handler: NodeCatchClause;
	finalizer: NodeBlockStatement;
}

/**
 * CatchClause type
 */
interface NodeCatchClause extends acorn.Node {
	param: NodeIdentifier;
	body: NodeBlockStatement;
}

/**
 * TemplateElement type
 */
interface NodeTemplateElement extends acorn.Node {
	value: {
		raw: string;
		cooked: string;
	};
	tail: boolean;
}

/**
 * UnaryExpression type
 */
interface NodeUnaryExpression extends acorn.Node {
	operator: string;
	prefix: boolean;
	argument: acorn.Node;
}

/**
 * AwaitExpression type
 */
interface NodeAwaitExpression extends acorn.Node {
	argument: acorn.Node;
}

/**
 * AssignmentExpression type
 */
interface NodeAssignmentExpression extends acorn.Node {
	operator: string;
	left: acorn.Node;
	right: acorn.Node;
}

// TODO: Add this later
// type NodeArrowFunctionExpression = acorn.Node & {
// 	id: acorn.Node & { name: string };
// 	expression: boolean;
// 	generator: boolean;
// 	async: boolean;
// 	params: NodeIdentifier[];
// 	body: acorn.Node;
// };
