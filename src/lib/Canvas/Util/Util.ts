export function getLineAndColumn(code: string, start: number): { line: number; column: number } {
	let line = 1;
	let column = 0;
	let scanned = 0;
	let next = 0;
	for (const codeLine of code.split('\n')) {
		next = scanned + codeLine.length;
		if (next >= start) {
			column = start - scanned;
			break;
		}
		scanned = next + 1;
		line++;
	}

	return { line, column };
}
