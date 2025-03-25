import { ITape } from "./ITape"
import { TapeTypes } from "./TapeTypes"
import { WriteOperation } from "./TapesUtilities/WriteOperation"
import { TapeSymbols } from "./TapesUtilities/TapeSymbols"

export class InfiniteTape implements ITape 
{
    public readonly Type: TapeTypes = TapeTypes.Infinite;
    public LeftBoundary: number = 0;
    public RightBoundary: number = 0;

    private _tape: Map<number, string> = new Map();
    private _writeQueue: WriteOperation[] = [];

    constructor(leftBoundary: number = 0, RightBoundary: number = 0)
    {
        this.LeftBoundary = leftBoundary;
        this.RightBoundary = RightBoundary;
    }

    public IsOutOfRange(): boolean 
    {
        // Infinite tape will never be out of range
        return false;
    }

    public Read(position: number): string 
    {
        if (this._tape.has(position))
            return TapeSymbols.Blank;

        return this._tape.get(position) || ' ';
    }

    public TryRead(position: number): { success: boolean; content: string | null } 
    {
        const read = this._tape.get(position);
        const content = read === undefined ? TapeSymbols.Blank : read;

        // Infinite tape will always be success
        return { success: true, content };
    }

    public ScheduleWrite(position: number, content: string, machineID: number, headID: number): void 
    {
        for (let op of this._writeQueue)
        {
            if (op.Position == position)
            {
                throw new Error(
                    `Machine ${machineID} Head ${headID} attempted to write '${content}', ` +
                    `but Machine ${op.MachineID} Head ${op.HeadID} has already scheduled a write to this position.`
                );
            }
        }

        const writeOp = new WriteOperation(position, content, machineID, headID);
        this._writeQueue.push(writeOp);
    }

    public CommitWrite() 
    {
        // Poping the last element like in a stack.
        // Since all operations happen at one step, a stack is enough here.
        while (this._writeQueue.length > 0)
        {
            let op = this._writeQueue.pop()!;

            if (op.Content == TapeSymbols.Blank)
                this._tape.delete(op.Position);
            else
                this._tape.set(op.Position, op.Content);
        }
    }

    public GetMovedPosition(position: number, moves: number): number 
    {
        return position + moves;
    }

    public InitializeContent(contents: string): void 
    {
        for (let i = 0; i < contents.length; i++)
        {
            this._tape.set(i, contents.charAt(i));
        }
    }

    public UpdateBoundaries(headPosition: number): void 
    {
        // Updates the boundaries based on how far the heads are going.
        this.LeftBoundary = Math.min(this.LeftBoundary, headPosition);
        this.RightBoundary = Math.max(this.RightBoundary, headPosition);
    }

    public GetContentsAsString()
    {
        let contents = "";

        for (let i = this.LeftBoundary; i <= this.RightBoundary; i++) {
            if (this._tape.has(i))
                contents += this._tape.get(i)!; // Use non-null assertion operator (!) because we know the value exists
            else
                contents += TapeSymbols.Blank;
            
        }

        return contents;
    }
}