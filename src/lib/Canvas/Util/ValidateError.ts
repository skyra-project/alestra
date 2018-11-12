import { getLineAndColumn } from './Util';

export class CompilationParseError extends Error {

	public constructor(code: string, start: number, message: string = 'Unknown Error') {
		const position = getLineAndColumn(code, start);
		super(`${message} (at ${position.line}:${position.column}).`);
	}

}

export class MethodParseError extends CompilationParseError { }

export class UnknownIdentifier extends CompilationParseError {

	public constructor(code: string, start: number, name: string) {
		super(code, start, `The identifier \`${name}\` is not defined`);
	}

}

export class AlreadyDeclaredIdentifier extends CompilationParseError {

	public constructor(code: string, start: number, name: string) {
		super(code, start, `The identifier \`${name}\` was already been declared`);
	}

}

export class SandboxError extends CompilationParseError {

	public constructor(code: string, start: number, name: string) {
		super(code, start, `The property access to \`${name}\` is forbidden`);
	}

}
