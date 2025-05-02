import { TapeSymbols } from "../../logic/Tapes/TapesUtilities/TapeSymbols";
import { TapeTypes } from "../../logic/Tapes/TapeTypes";
import { Tape } from "./simulator";

function circulate(pos: number, length: number) {
	if (pos >= length) pos %= length;
	else while (pos < 0) pos += length;
	return pos;
}

// each type maps to a css class
export enum CellType {
	NORMAL = "",
	BOUNDARY = " boundary",
	RUNNING = " running",
	PAUSE = " pause",
}

function determineCellType(char: string, boundary?: boolean) {
	switch (char) {
		case TapeSymbols.Pause: return CellType.PAUSE;
		case TapeSymbols.Running: return CellType.RUNNING;
	}
	if (boundary) return CellType.BOUNDARY;
	return CellType.NORMAL;
}

// used in src/components/simulation/machine/tape.tsx and src/components/simulation/tape-only.tsx
export function tapeToSevenCells(tape: Tape, pos: number) {
	let content = tape.content || "";
	let head = pos - tape.left;
	let char: string;
	const cells: { char: string, type: CellType }[] = [];
	switch (tape.type) {
		case TapeTypes.Infinite: {
			cells.push({ char: char = content.charAt(head), type: determineCellType(char) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				char = content.charAt(left);
				cells.unshift({ char, type: determineCellType(char) });
				// right
				let right = head + ii;
				char = content.charAt(right);
				cells.push({ char, type: determineCellType(char) });
			}
			break;
		}
		case TapeTypes.LeftLimited: {
			if (content.startsWith(">")) content = content.slice(1);
			cells.push({ char: char = content.charAt(head), type: determineCellType(char, head < 0) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				char = content.charAt(left);
				cells.unshift({ char, type: determineCellType(char, left < 0) });
				// right
				let right = head + ii;
				char = content.charAt(right);
				cells.push({ char, type: determineCellType(char, right < 0) });
			}
			break;
		}
		case TapeTypes.RightLimited: {
			let boundR = tape.right;
			cells.push({ char: char = content.charAt(head) == "<" ? "" : content.charAt(head), type: determineCellType(char, head >= boundR) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				char = content.charAt(left);
				cells.unshift({ char, type: determineCellType(char, left >= boundR) });
				// right
				let right = head + ii;
				char = content.charAt(right);
				if (char == "<") cells.push({ char: "", type: determineCellType("", true) });
				else cells.push({ char, type: determineCellType(char, right >= boundR) });
			}
			break;
		}
		case TapeTypes.LeftRightLimited: {
			let boundR = tape.right;
			if (content.startsWith(TapeSymbols.Start)) content = content.slice(1);
			cells.push({ char: char = content.charAt(head), type: determineCellType(char, head < 0 || head >= boundR) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				char = content.charAt(left);
				cells.unshift({ char, type: determineCellType(char, left < 0) });
				// right
				let right = head + ii;
				char = content.charAt(right);
				if (char == "<") cells.push({ char: "", type: determineCellType("", true) });
				else cells.push({ char, type: determineCellType(char, right >= boundR) });
			}
			break;
		}
		case TapeTypes.Circular: {
			content = content.slice(content.startsWith(TapeSymbols.Start) ? 1 : 0, content.endsWith(TapeSymbols.End) ? -1 : content.length);
			head = circulate(head, content.length);
			cells.push({ char: char = content.charAt(head), type: determineCellType(char) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				let correctedLeft = circulate(left, content.length);
				char = content.charAt(correctedLeft);
				cells.unshift({ char, type: determineCellType(char, left < 0) });
				// right
				let right = head + ii;
				let correctedRight = circulate(right, content.length);
				char = content.charAt(correctedRight);
				cells.push({ char, type: determineCellType(char, right >= content.length) });
			}
			break;
		}
	}
	return cells;
}