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

function determineCellType(signal: string, boundary?: boolean) {
	switch (signal) {
		case "2": return CellType.PAUSE;
		case "1": return CellType.RUNNING;
	}
	if (boundary) return CellType.BOUNDARY;
	return CellType.NORMAL;
}

// used in src/components/simulation/machine/tape.tsx and src/components/simulation/tape-only.tsx
export function tapeToSevenCells(tape: Tape, pos: number) {
	let content = tape.content || "";
	let signals = tape.signals;
	let head = pos - tape.left;
	const cells: { char: string, type: CellType }[] = [];
	switch (tape.type) {
		case TapeTypes.Infinite: {
			cells.push({ char: content.charAt(head), type: determineCellType(signals.charAt(head)) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				cells.unshift({ char: content.charAt(left), type: determineCellType(signals.charAt(left)) });
				// right
				let right = head + ii;
				cells.push({ char: content.charAt(right), type: determineCellType(signals.charAt(right)) });
			}
			break;
		}
		case TapeTypes.LeftLimited: {
			if (content.startsWith(">")) content = content.slice(1);
			cells.push({ char: content.charAt(head), type: determineCellType(signals.charAt(head), head < 0) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				cells.unshift({ char: content.charAt(left), type: determineCellType(signals.charAt(left), left < 0) });
				// right
				let right = head + ii;
				cells.push({ char: content.charAt(right), type: determineCellType(signals.charAt(right), right < 0) });
			}
			break;
		}
		case TapeTypes.RightLimited: {
			let boundR = tape.right;
			let char: string;
			cells.push({ char: content.charAt(head) == "<" ? "" : content.charAt(head), type: determineCellType(signals.charAt(head), head >= boundR) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				cells.unshift({ char: content.charAt(left), type: determineCellType(signals.charAt(left), left >= boundR) });
				// right
				let right = head + ii;
				char = content.charAt(right);
				if (char == "<") cells.push({ char: "", type: determineCellType("", true) });
				else cells.push({ char, type: determineCellType(signals.charAt(right), right >= boundR) });
			}
			break;
		}
		case TapeTypes.LeftRightLimited: {
			let boundR = tape.right;
			let char: string;
			if (content.startsWith(TapeSymbols.Start)) content = content.slice(1);
			cells.push({ char: content.charAt(head), type: determineCellType(signals.charAt(head), head < 0 || head >= boundR) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				cells.unshift({ char: content.charAt(left), type: determineCellType(signals.charAt(left), left < 0) });
				// right
				let right = head + ii;
				char = content.charAt(right);
				if (char == "<") cells.push({ char: "", type: determineCellType("", true) });
				else cells.push({ char, type: determineCellType(signals.charAt(right), right >= boundR) });
			}
			break;
		}
		case TapeTypes.Circular: {
			content = content.slice(content.startsWith(TapeSymbols.Start) ? 1 : 0, content.endsWith(TapeSymbols.End) ? -1 : content.length);
			head = circulate(head, content.length);
			cells.push({ char: content.charAt(head), type: determineCellType(signals.charAt(head)) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				let correctedLeft = circulate(left, content.length);
				cells.unshift({ char: content.charAt(correctedLeft), type: determineCellType(signals.charAt(left), left < 0) });
				// right
				let right = head + ii;
				let correctedRight = circulate(right, content.length);
				cells.push({ char: content.charAt(correctedRight), type: determineCellType(signals.charAt(right), right >= content.length) });
			}
			break;
		}
	}
	return cells;
}