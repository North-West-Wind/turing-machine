import { ITape } from "./ITape"
import { TapeTypes } from "./TapeTypes"
import { WriteOperation } from "./TapesUtilities/WriteOperation"
import { TapeSymbols } from "./TapesUtilities/TapeSymbols"
import { SignalState } from "../States/SignalStates";

export class CircularTape implements ITape
{
    // Getter for the tape type
    public get Type(): TapeTypes {
        return TapeTypes.Circular;
    }

    private _leftBoundary: number = 0;
    private _rightBoundary: number = 0;

    // Public getters for boundaries
    public get LeftBoundary(): number {
        return this._leftBoundary;
    }

    public get RightBoundary(): number {
        return this._rightBoundary;
    }

    private _tape: Map<number, string> = new Map();
    private _states: Map<number, SignalState> = new Map();
    private _writeQueue: WriteOperation[] = [];

    constructor(_leftBoundary: number = 0, _rightBoundary: number = 0)
    {
        this._leftBoundary = _leftBoundary;
        this._rightBoundary = _rightBoundary;

        // Stores the boundaries for displaying on the UI
        this._tape.set(this._leftBoundary - 1, TapeSymbols.Start)
        this._tape.set(this._rightBoundary + 1, TapeSymbols.End)
    }

    public IsOutOfRange(): boolean 
    {
        // Circular tape will never be out of range
        return false;
    }

    public Read(position: number): string 
    {
        if (this._tape.has(position))
            return TapeSymbols.Blank;

        return this._tape.get(position) || ' ';
    }

    public SendSignal(position: number): SignalState
    {
        if (!this._states.has(position))
            return SignalState.Other;

        return this._states.get(position)!;
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
        if (content.length != 1)
            throw new RangeError("The write content must be a single character.");
        
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
        // Poping the last element like in a stack
        // Since all operations happen at one step, a stack is enough here
        while (this._writeQueue.length > 0)
        {
            let op = this._writeQueue.pop()!;

            // Handle signal states
            if (op.Content == TapeSymbols.Pause || op.Content == TapeSymbols.Running) {
                this._states.set(op.Position, 
                    op.Content === TapeSymbols.Pause ? SignalState.Orange : SignalState.Green);
                
                continue;
            }
            
            // Handle regular tape content
            if (op.Content == TapeSymbols.Blank)
                this._tape.delete(op.Position);
            else
                this._tape.set(op.Position, op.Content);
        }
    }

    public RemoveSignal(position: number): void
    {
        this._states.delete(position);
    }

    public GetMovedPosition(position: number, moves: number): number {
        const tapeLength = this._rightBoundary - this._leftBoundary + 1;

        let newPosition = position + moves;
            
        // Shift the range to [0, rightBoundary - leftBoundary]
        // Obtain the new position, then shift back to the original range
        newPosition = ((newPosition - this._leftBoundary) % tapeLength + tapeLength) % tapeLength + this._leftBoundary;
            
        return newPosition;
    }

    public InitializeContent(contents: string): void 
    {
        for (let i = this._leftBoundary; i < this._leftBoundary + contents.length; i++)
        {
            this._tape.set(i, contents.charAt(i));
        }
    }

    public UpdateBoundaries(): void 
    {
        // The boundaries of Circular tape is fixed
    }

    public GetContentsAsString()
    {
        let contents = "";

        for (let i = this._leftBoundary - 1; i <= this._rightBoundary + 1; i++) {
            if (this._tape.has(i))
                contents += this._tape.get(i)!;
            else
                contents += TapeSymbols.Blank;
            
        }

        return contents;
    }
}