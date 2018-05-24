import { CompilationParseError } from '../Util/ValidateError.mjs';
import { QUOTES, NUMBER, SPACE, VARCHAR, CHAR } from '../Util/Constants';

export class ArgumentParser {

	constructor(line) {
		this.line = line;
		this.parsed = [];
		this.i = 0;
		this.type = null;
		this.quote = null;
		this.chunk = '';
		this.nest = 0;
	}

	parse() {
		const { line } = this;
		if (line === null) throw new Error('The parser is disposed.');

		const maxLen = line.length;
		let char;

		while (this.i < maxLen) {
			char = line.charAt(this.i);

			switch (this.type) {
				case null: this._parseInitialization(char); break;
				case 'variable': this._parseVariable(char); break;
				case 'string': this._parseString(char); break;
				case 'number': this._parseNumber(char);	break;
				case 'array': this._parseArray(char); break;
				case 'object': this._parseObject(char); break;
				default:
					break;
			}

			this.i++;
		}

		if (this.type) {
			switch (this.type) {
				case null: break;
				case 'variable': this._endArgument(parseLiteral(this.chunk)); break;
				case 'number': this._endArgument(Number(this.chunk)); break;
				case 'string': throw new CompilationParseError(`Cannot parse \`${this.quote}${this.chunk}\` into a string: it must end with \`${this.quote}\`.`);
				case 'object': throw new CompilationParseError(`Cannot parse \`${this.chunk}\` into an object: it is not terminated.`);
				default: throw new CompilationParseError(`Cannot parse \`${this.chunk}\` into a valid argument.`);
			}
		}

		return this.parsed;
	}

	dispose() {
		this.line = null;
		this.parsed = null;
		this.i = null;
		this.type = null;
		this.quote = null;
		this.chunk = null;
		this.nest = null;
	}

	_endArgument(parsed, offset = 0) {
		this.parsed.push({ type: this.type, value: parsed });
		this.quote = null;
		this.type = null;
		this.chunk = '';
		if (this.line.charAt(this.i + 1 + offset) === ',') this.i += 1;
	}

	_parseInitialization(char) {
		if (CHAR.test(char)) {
			this.type = 'variable';
			this.chunk = char;
		} else if (QUOTES.test(char)) {
			this.type = 'string';
			this.quote = char;
		} else if (NUMBER.test(char)) {
			this.type = 'number';
			this.chunk += char;
		} else if (char === '[') {
			this.type = 'array';
		} else if (char === '{') {
			this.type = 'object';
			this.chunk += char;
		} else if (char === ',') {
			this.parsed.push(undefined);
		} else if (!SPACE.test(char)) {
			throw new CompilationParseError(`Cannot parse ${char} at position ${this.i}`);
		}
	}

	_parseVariable(char) {
		if (VARCHAR.test(char)) this.chunk += char;
		else if (char === ',') this._endArgument(parseLiteral(this.chunk), 1);
		else throw new CompilationParseError('Failed to parse literal');
	}

	_parseString(char) {
		if (char === '\\' && this.line.charAt(this.i + 1) === this.quote) {
			this.chunk += this.quote;
			this.i += 2;
		} else if (char === this.quote) {
			this._endArgument(this.chunk);
		} else {
			this.chunk += char;
		}
	}

	_parseNumber(char) {
		if (char === ',') this._endArgument(Number(this.chunk), 1);
		else if (NUMBER.test(char)) this.chunk += char;
		else throw new CompilationParseError('Failed to parse number');
	}

	_parseArray(char) {
		if (char === ']') this._endArgument(new ArgumentParser(this.chunk).parse());
		else this.chunk += char;
	}

	_parseObject(char) {
		this.chunk += char;
		if (char === '{') {
			this.nest++;
		} else if (char === '}') {
			if (this.nest === 0) this._endArgument(parse(this.chunk.replace(/([^"])(\w[\w\d]+):/g, '$1"$2":')));
			else this.nest--;
		}
	}

}

export function parseLiteral(literal) {
	switch (literal) {
		case 'null': return null;
		case 'false': return false;
		case 'true': return true;
		case 'undefined': return undefined;
		case 'Infinity': return Infinity;
		case 'NaN': return NaN;
		default:
			if (literal in global) throw new CompilationParseError(`The literal \`${literal}\` is not available.`);
			return literal;
	}
}

function parse(string) {
	const fixed = string.replace(/([^"])(\w[\w\d]+):/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ':"$1"');

	try {
		const parsed = JSON.parse(fixed);
		return parsed;
	} catch (_) {
		throw new CompilationParseError(`Could not parse the JSON object \`${string}\`.`);
	}
}
