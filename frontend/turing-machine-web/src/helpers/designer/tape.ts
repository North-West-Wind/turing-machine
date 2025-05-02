import { TapeSymbols } from "../../logic/Tapes/TapesUtilities/TapeSymbols";
import { TapeTypes } from "../../logic/Tapes/TapeTypes";
import { Tape } from "./simulator";

function circulate(pos: number, length: number) {
	if (pos >= length) pos %= length;
	else while (pos < 0) pos += length;
	return pos;
}

// used in src/components/simulation/machine/tape.tsx and src/components/simulation/tape-only.tsx
export function tapeToSevenCells(tape: Tape, pos: number) {
	let content = tape.content || "";
	let head = pos - tape.left;
	const cells: { char: string, boundary?: boolean }[] = [];
	switch (tape.type) {
		case TapeTypes.Infinite:
			cells.push({ char: content.charAt(head) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				if (left < 0) cells.unshift({ char: "" });
				else cells.unshift({ char: content.charAt(left) });
				// right
				let right = head + ii;
				if (right >= content.length) cells.push({ char: "" });
				else cells.push({ char: content.charAt(right) });
			}
			break;
		case TapeTypes.LeftLimited: {
			if (content.startsWith(">")) content = content.slice(1);
			cells.push({ char: content.charAt(head), boundary: head < 0 }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				if (left < 0) cells.unshift({ char: "", boundary: true });
				else cells.unshift({ char: content.charAt(left) });
				// right
				let right = head + ii;
				if (right >= content.length) cells.push({ char: "" });
				else cells.push({ char: content.charAt(right), boundary: right < 0 });
			}
			break;
		}
		case TapeTypes.RightLimited: {
			let boundR = tape.right;
			cells.push({ char: content.charAt(head) == "<" ? "" : content.charAt(head), boundary: head >= boundR }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				if (left < 0) cells.unshift({ char: "", boundary: left >= boundR });
				else cells.unshift({ char: content.charAt(left), boundary: left >= boundR });
				// right
				let right = head + ii;
				if (right >= content.length) cells.push({ char: "", boundary: right >= boundR });
				else if (content.charAt(right) == "<") cells.push({ char: "", boundary: true });
				else cells.push({ char: content.charAt(right) });
			}
			break;
		}
		case TapeTypes.LeftRightLimited: {
			let boundR = tape.right;
			if (content.startsWith(TapeSymbols.Start)) content = content.slice(1);
			cells.push({ char: content.charAt(head) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				if (left < 0) cells.unshift({ char: "", boundary: true });
				else cells.unshift({ char: content.charAt(left) });
				// right
				let right = head + ii;
				if (right >= content.length) cells.push({ char: "", boundary: right >= boundR });
				else if (content.charAt(right) == "<") cells.unshift({ char: "", boundary: true });
				else cells.push({ char: content.charAt(right) });
			}
			break;
		}
		case TapeTypes.Circular: {
			content = content.slice(content.startsWith(TapeSymbols.Start) ? 1 : 0, content.endsWith(TapeSymbols.End) ? -1 : content.length);
			head = circulate(head, content.length);
			cells.push({ char: content.charAt(head) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				let correctedLeft = circulate(left, content.length);
				cells.unshift({ char: content.charAt(correctedLeft), boundary: left < 0 });
				// right
				let right = head + ii;
				let correctedRight = circulate(right, content.length);
				cells.push({ char: content.charAt(correctedRight), boundary: right >= content.length });
			}
			break;
		}
	}
	return cells;
}