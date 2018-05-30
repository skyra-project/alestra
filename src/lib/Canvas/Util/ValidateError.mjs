import { Type } from 'klasa';

export class CompilationParseError extends Error {

	toString() {
		return `${this.constructor.name}: ${this.message}`;
	}

}

export class MethodParseError extends CompilationParseError { }

export class MethodError extends Error {

	constructor(method) {
		super();
		this.method = method;
		this.reason = null;
	}

	toString() {
		return `${this.constructor.name} on method ${this.method.name}: ${this.reason}`;
	}

}

export class TooManyArgumentsMethodError extends MethodError {

	constructor(method, argLength) {
		super(method);
		this.reason = `Expected ${method.arguments.length} arguments${method.arguments.length > method.required ? ' or less' : ''}. Received: ${argLength}`;
	}

}

export class ValidateError extends Error {

	constructor(argument) {
		super();

		this.argument = argument;
		this.reason = null;
	}

	toString() {
		return `${this.constructor.name} on ${this.argument.parent.name} at argument ${this.argument.name}: ${this.reason}`;
	}

}

export class RequiredArgumentError extends ValidateError {

	constructor(argument) {
		super(argument);
		this.reason = `Expected an argument type ${argument.type}`;
	}

}

export class UnknownArgumentPropertyError extends ValidateError {

	constructor(argument, property) {
		super(argument);
		this.reason = `Unknown property ${property}.`;
	}

}

export class IncorrectArgumentError extends ValidateError {

	constructor(argument, got) {
		super(argument);
		this.reason = `Expected an argument type ${argument.type}, got ${new Type(got)}`;
	}

}

export class ArgumentParseError extends ValidateError {

	constructor(argument, reason) {
		super(argument);
		this.reason = reason;
	}

}
