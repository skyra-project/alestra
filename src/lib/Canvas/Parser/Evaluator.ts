import { Node, parse } from 'acorn';
import * as CanvasConstructor from 'canvas-constructor';
import { AlreadyDeclaredIdentifier, CompilationParseError, SandboxError, UnknownIdentifier } from '../Util/ValidateError';

const kUnset = Symbol('unset');
const defaultIdentifiers = Object.entries(CanvasConstructor);

export default class Evaluator {

	public parse(input: string): any {
		return this.parseNode({
			allowSpread: false,
			code: input,
			identifiers: new Map(defaultIdentifiers)
		}, parse(input), null);
	}

	private parseNode(ctx: EvaluatorContext, node: Node, scope: Scope): any {
		const unknownNode: any = node;
		ctx.allowSpread = false;
		switch (node.type) {
			case 'AssignmentExpression': return this.parseAssignmentExpression(ctx, unknownNode as NodeAssignmentExpression, scope);
			case 'TemplateLiteral': return this.parseTemplateLiteral(ctx, unknownNode as NodeTemplateLiteral, scope);
			case 'TemplateElement': return this.parseTemplateElement(ctx, unknownNode as NodeTemplateElement, scope);
			// case 'ArrowFunctionExpression': return this.parseArrowFunctionExpression(ctx, unknownNode as NodeArrowFunctionExpression);
			case 'ArrayExpression': return this.parseArrayExpression(ctx, unknownNode as NodeArrayExpression, scope);
			case 'BinaryExpression': return this.parseBinaryExpression(ctx, unknownNode as NodeBinaryExpression, scope);
			case 'SpreadElement': return this.parseSpreadElement(ctx, unknownNode as NodeSpreadElement, scope);
			case 'CallExpression': return this.parseCallExpression(ctx, unknownNode as NodeCallExpression, scope);
			case 'ExpressionStatement': return this.parseExpressionStatement(ctx, unknownNode as NodeExpressionStatement, scope);
			case 'Identifier': return this.parseIdentifier(ctx, unknownNode as NodeIdentifier, scope);
			case 'Literal': return this.parseLiteral(ctx, unknownNode as NodeLiteral);
			case 'MemberExpression': return this.parseMemberExpression(ctx, unknownNode as NodeMemberExpression, scope);
			case 'NewExpression': return this.parseNewExpression(ctx, unknownNode as NodeNewExpression, scope);
			case 'Program': return this.parseProgram(ctx, unknownNode as NodeProgram, scope);
			case 'VariableDeclaration': return this.parseVariableDeclaration(ctx, unknownNode as NodeVariableDeclaration, scope);
			case 'VariableDeclarator': return this.parseVariableDeclarator(ctx, unknownNode as NodeVariableDeclarator, scope);
			case 'ObjectExpression': return this.parseObjectExpression(ctx, unknownNode as NodeObjectExpression, scope);
			default: throw new CompilationParseError(ctx.code, node.start, 'Unsupported feature');
		}
	}

	private parseSpreadElement(ctx: EvaluatorContext, node: NodeSpreadElement, scope: Scope): Iterable<any> {
		if (!ctx.allowSpread) throw new CompilationParseError(ctx.code, node.start, 'Spread was not expected yet');
		const arg = this.parseNode(ctx, node.argument, scope);
		if (Symbol.iterator in arg) return arg;
		throw new CompilationParseError(ctx.code, node.start, 'A iterable was not given');
	}

	private parseTemplateElement(_: EvaluatorContext, node: NodeTemplateElement, __: Scope): string {
		return node.value.cooked;
	}

	private parseTemplateLiteral(ctx: EvaluatorContext, node: NodeTemplateLiteral, scope: Scope): string {
		return node.expressions.concat(node.quasis)
			.sort((a, b) => a.start - b.start)
			.map((element) => this.parseNode(ctx, element, scope))
			.join('');
	}

	private parseArrayExpression(ctx: EvaluatorContext, node: NodeArrayExpression, scope: Scope): Array<any> {
		const array = [];
		for (const element of node.elements) {
			ctx.allowSpread = true;
			if (element.type === 'SpreadElement') array.push(...this.parseSpreadElement(ctx, <unknown> element as NodeSpreadElement, scope));
			else array.push(this.parseNode(ctx, element, scope));
		}
		ctx.allowSpread = false;
		return array;
	}

	private parseObjectExpression(ctx: EvaluatorContext, node: NodeObjectExpression, scope: Scope): any {
		const entries = [];
		for (const property of node.properties) {
			const key = this.parseNode(ctx, property.key, scope);
			const value = this.parseNode(ctx, property.value, scope);
			entries.push({ [key]: value });
		}
		return Object.seal(Object.assign({}, ...entries));
	}

	private parseAssignmentExpression(ctx: EvaluatorContext, node: NodeAssignmentExpression, scope: Scope): any {
		const name = (<unknown> node.left as NodeIdentifier).name;
		const type = scope && scope.has(name)
			? ScopeType.Local
			: ctx.identifiers.has(name)
				? ScopeType.Global
				: ScopeType.None;

		if (type === ScopeType.None) throw new UnknownIdentifier(ctx.code, node.start, name);

		const left = this.parseNode(ctx, node.left, scope);
		const right = this.parseNode(ctx, node.right, scope);
		const operator = binaryOperators.get(node.operator.slice(0, node.operator.length - 1));
		if (operator) {
			const value = operator(left, right);
			if (type === ScopeType.Local) scope.set(name, value);
			else ctx.identifiers.set(name, value);
			return value;
		}
		throw new CompilationParseError(ctx.code, node.start, 'Unsupported feature');
	}

	private parseProgram(ctx: EvaluatorContext, node: NodeProgram, scope: Scope): any {
		return node.body.map((nd) => this.parseNode(ctx, nd, scope)).pop();
	}

	private parseCallExpression(ctx: EvaluatorContext, node: NodeNewExpression, scope: Scope): any {
		const member = this.parseNode(ctx, node.callee, scope);
		if (typeof member !== 'function') throw new CompilationParseError(ctx.code, node.start, `${node.callee}`);
		const args = node.arguments.map((arg) => this.parseNode(ctx, arg, scope));
		return member(args);
	}

	private parseNewExpression(ctx: EvaluatorContext, node: NodeNewExpression, scope: Scope): any {
		const ctor: new (...args: any[]) => any = this.parseNode(ctx, node.callee, scope);
		if (typeof ctor !== 'function') throw new CompilationParseError(ctx.code, node.start, 'Constructor is not a function');
		const args = node.arguments.map((arg: Node) => this.parseNode(ctx, arg, scope));
		return new ctor(...args);
	}

	private parseExpressionStatement(ctx: EvaluatorContext, node: NodeExpressionStatement, scope: Scope): any {
		return this.parseNode(ctx, node.expression, scope);
	}

	private parseMemberExpression(ctx: EvaluatorContext, node: NodeMemberExpression, scope: Scope): string {
		const object = this.parseNode(ctx, node.object, scope);
		const propertyName = (<unknown> node.property as NodeIdentifier).name;
		let property: any = kUnset;

		if (node.computed) {
			// If `[variable]()`
			if (ctx.identifiers.has(propertyName)) property = ctx.identifiers.get(propertyName);
			else if (scope && scope.has(propertyName)) property = scope.get(propertyName);
		} else {
			// If .variable
			property = propertyName;
		}

		if (property === kUnset) throw new UnknownIdentifier(ctx.code, node.property.start, propertyName);
		if (property === 'constructor') throw new SandboxError(ctx.code, node.property.start, propertyName);
		return object[property];
	}

	private parseVariableDeclaration(ctx: EvaluatorContext, node: NodeVariableDeclaration, scope: Scope): any {
		return node.declarations.map((declarator) => this.parseVariableDeclarator(ctx, declarator, scope)).pop();
	}

	private parseVariableDeclarator(ctx: EvaluatorContext, node: NodeVariableDeclarator, scope: Scope): any {
		if (!node.id || !node.id.name) throw new CompilationParseError(ctx.code, node.start, 'Failed to parse declarator identifier');
		if (ctx.identifiers.has(node.id.name) || scope && scope.has(node.id.name)) throw new AlreadyDeclaredIdentifier(ctx.code, node.start, node.id.name);
		if (node.init) {
			const value = this.parseNode(ctx, node.init, scope);
			if (scope) scope.set(node.id.name, value);
			else ctx.identifiers.set(node.id.name, value);
			return value;
		}

		return undefined;
	}

	// private parseArrowFunctionExpression(ctx: EvaluatorContext, node: NodeArrowFunctionExpression, scope: Scope): Function {
	// 	return (): null => null;
	// }

	private parseBinaryExpression(ctx: EvaluatorContext, node: NodeBinaryExpression, scope: Scope): any {
		const left = this.parseNode(ctx, node.left, scope);
		const right = this.parseNode(ctx, node.right, scope);
		const operator = binaryOperators.get(node.operator);
		if (operator) return operator(left, right);
		throw new CompilationParseError(ctx.code, node.start, 'Unsupported feature');
	}

	private parseIdentifier(ctx: EvaluatorContext, node: NodeIdentifier, scope: Scope): any {
		if (ctx.identifiers.has(node.name)) return ctx.identifiers.get(node.name);
		if (scope && scope.has(node.name)) return scope.get(node.name);
		throw new UnknownIdentifier(ctx.code, node.start, node.name);
	}

	private parseLiteral(_: EvaluatorContext, node: NodeLiteral): any {
		return node.value;
	}

}

export const binaryOperators: Map<string, (left: any, right: any) => any> = new Map()
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

export const unaryOperators: Map<string, (value: any) => any> = new Map()
	// Bitwise operators
	.set('~', (value: any) => ~value)

	// Boolean operators
	.set('!', (value: any) => !value);

enum ScopeType { Global, Local, None }

type Scope = Map<string, any> | null;

type EvaluatorContext = {
	allowSpread: boolean;
	code: string;
	identifiers: Map<string, any>;
};

type NodeProgram = acorn.Node & {
	body: acorn.Node[];
};

type NodeMemberExpression = acorn.Node & {
	object: acorn.Node;
	property: acorn.Node;
	computed: boolean;
};

type NodeVariableDeclaration = acorn.Node & {
	property: NodeIdentifier;
	kind: 'var' | 'let' | 'const';
	declarations: NodeVariableDeclarator[];
};

type NodeObjectExpression = acorn.Node & {
	properties: NodeProperty[];
};

type NodeProperty = acorn.Node & {
	method: boolean;
	shorthand: boolean;
	computed: boolean;
	key: acorn.Node;
	value: acorn.Node;
	kind: string;
};

type NodeVariableDeclarator = acorn.Node & {
	id: NodeIdentifier;
	init: acorn.Node | null;
};

type NodeCallExpression = acorn.Node & {
	callee: acorn.Node;
	arguments: acorn.Node[];
};

type NodeLiteral = acorn.Node & {
	value: any;
	raw: string;
};

type NodeIdentifier = acorn.Node & {
	name: string;
};

type NodeArrayExpression = acorn.Node & {
	elements: acorn.Node[];
};

type NodeSpreadElement = acorn.Node & {
	argument: acorn.Node;
};

type NodeBinaryExpression = acorn.Node & {
	left: acorn.Node;
	right: acorn.Node;
	operator: string;
};

type NodeNewExpression = acorn.Node & {
	callee: acorn.Node;
	arguments: acorn.Node[];
};

type NodeExpressionStatement = acorn.Node & {
	expression: acorn.Node;
};

type NodeTemplateLiteral = acorn.Node & {
	expressions: acorn.Node[];
	quasis: NodeTemplateElement[];
};

type NodeTemplateElement = acorn.Node & {
	value: {
		raw: string;
		cooked: string;
	};
	tail: boolean;
};

type NodeAssignmentExpression = acorn.Node & {
	operator: string;
	left: Node;
	right: Node;
};

// TODO: Add this later
// type NodeArrowFunctionExpression = acorn.Node & {
// 	id: acorn.Node & { name: string };
// 	expression: boolean;
// 	generator: boolean;
// 	async: boolean;
// 	params: NodeIdentifier[];
// 	body: Node;
// };
