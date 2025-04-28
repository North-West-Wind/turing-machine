import { Tape } from "../../../../helpers/designer/simulator";
import { TapeSymbols } from "../../../../logic/Tapes/TapesUtilities/TapeSymbols";
import { TapeTypes } from "../../../../logic/Tapes/TapeTypes";

export default function DesignerSimulationMachineTape(props: { tape?: Tape, head: number }) {
	if (!props.tape) return <></>;
	// process tape to make it 7-cell
	let content = props.tape.content || "";
	const head = props.head - props.tape.left;
	const cells: { char: string, boundary?: boolean }[] = [];
	switch (props.tape.type) {
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
			content = content.slice(1);
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
			let boundR = props.tape.right;
			cells.push({ char: content.charAt(head) == "<" ? "" : content.charAt(head), boundary: head >= boundR }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				if (left < 0) cells.unshift({ char: "", boundary: left >= boundR });
				else cells.unshift({ char: content.charAt(left) });
				// right
				let right = head + ii;
				if (right >= content.length) cells.push({ char: "", boundary: right >= boundR });
				else if (content.charAt(right) == "<") cells.push({ char: "", boundary: true });
				else cells.push({ char: content.charAt(right) });
			}
			break;
		}
		case TapeTypes.LeftRightLimited: {
			let boundR = false;
			content = content.slice(1);
			cells.push({ char: content.charAt(head) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				if (left < 0) cells.unshift({ char: "", boundary: true });
				else cells.unshift({ char: content.charAt(left) });
				// right
				let right = head + ii;
				if (right >= content.length) cells.push({ char: "", boundary: boundR });
				else if (content.charAt(right) == "<") cells.unshift({ char: "", boundary: boundR = true });
				else cells.push({ char: content.charAt(right) });
			}
			break;
		}
		case TapeTypes.Circular: {
			// TODO: i'll figure this out later
			let boundL = false, boundR = false;
			cells.push({ char: content.charAt(head + 1) }); // middle
			for (let ii = 1; ii <= 3; ii++) {
				// left
				let left = head - ii;
				if (left < 0) cells.unshift({ char: "", boundary: boundL });
				else if (content.charAt(left) == ">") cells.unshift({ char: content.charAt(left), boundary: boundL = true });
				else cells.unshift({ char: content.charAt(left) });
				// right
				let right = head + ii;
				if (right >= content.length) cells.push({ char: "", boundary: boundR });
				else if (content.charAt(right) == "<") cells.unshift({ char: content.charAt(right), boundary: boundR = true });
				else cells.push({ char: content.charAt(right) });
			}
			break;
		}
	}

	return <div className="designer-simulation-tape">
		{cells.map((cell, ii) => <div className={"designer-simulation-cell" + (ii == 3 ? " head" : "") + (cell.boundary ? " boundary" : "")} key={ii}>{cell.char == TapeSymbols.Blank ? "" : cell.char}</div>)}
	</div>;
}