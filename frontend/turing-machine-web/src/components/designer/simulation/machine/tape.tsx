import { Tape } from "../../../../helpers/designer/simulator";
import { tapeToSevenCells } from "../../../../helpers/designer/tape";
import { TapeSymbols } from "../../../../logic/Tapes/TapesUtilities/TapeSymbols";

export default function DesignerSimulationMachineTape(props: { tape?: Tape, head: number }) {
	if (!props.tape) return <></>;
	// process tape to make it 7-cell
	const cells = tapeToSevenCells(props.tape, props.head);

	return <div className="designer-simulation-tape">
		{cells.map((cell, ii) => <div className={"designer-simulation-cell" + (ii == 3 ? " head" : "") + cell.type} key={ii}>{cell.char == TapeSymbols.Blank ? "" : cell.char}</div>)}
	</div>;
}