import { ITape } from "./ITape"
import { TapeTypes } from "./TapeTypes"
import { WriteOperation } from "./TapesUtilities/WriteOperation"
import { TapeSymbols } from "./TapesUtilities/TapeSymbols"
import { SignalState } from "../States/SignalStates";

export class LimitedTape implements ITape
{
    private _tapeType: TapeTypes = TapeTypes.LeftRightLimited;

    // Getter for the tape type
    public get Type(): TapeTypes {
        return this._tapeType;
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

    /**
     * Constructor for creating a Limited tape object.
     * @throws {TypeError} when both left anf right are not limited.
     */
    constructor(isLeftBounded: boolean, isRightBounded: boolean, _leftBoundary: number = 0, _rightBoundary: number = 0)
    {
        this._leftBoundary = _leftBoundary;
        this._rightBoundary = _rightBoundary;

        // Assigns tape types and stores the boundaries for displaying on the UI
        switch (true) {
            case isLeftBounded && !isRightBounded:
                this._tapeType = TapeTypes.LeftLimited;
                this._tape.set(this._leftBoundary - 1, TapeSymbols.Start)
                break;

            case !isLeftBounded && isRightBounded:
                this._tapeType = TapeTypes.RightLimited;
                this._tape.set(this._rightBoundary + 1, TapeSymbols.End)
                break;
                
            case isLeftBounded && isRightBounded:
                this._tapeType = TapeTypes.LeftRightLimited;
                this._tape.set(this._leftBoundary - 1, TapeSymbols.Start)
                this._tape.set(this._rightBoundary + 1, TapeSymbols.End)
                break;
                
            default:
                throw new TypeError(
                    "Limited tape must be either left or right limited. Hint: Use Infinite tape."
                );
        }
    }

    public IsOutOfRange(position: number): boolean 
    {
        switch (this._tapeType) {
            case TapeTypes.LeftLimited:
                return position < this._leftBoundary;
            
            case TapeTypes.RightLimited:
                return position > this._rightBoundary;
            
            case TapeTypes.LeftRightLimited:
                return position > this._rightBoundary || position < this._leftBoundary;
        }

        return false;
    }

    public Read(position: number): string 
    {
        if (this.IsOutOfRange(position))
            throw new RangeError("Read out of range!");
            
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
        if (this.IsOutOfRange(position))
        {
            return { success: false, content: null };
        }

        const read = this._tape.get(position);
        const content = read === undefined ? TapeSymbols.Blank : read;

        return { success: true, content };
    }

    public ScheduleWrite(position: number, content: string, machineID: number, headID: number): void 
    {
        if (content.length != 1)
            throw new RangeError("The write content must be a single character.");

        if (this.IsOutOfRange(position))
            throw new RangeError("Write out of range!");
        
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

    public GetMovedPosition(position: number, moves: number): number 
    {
        // No exception is thrown even if it is out of range
        // It will be handled by write and read operations
        return position + moves;
    }

    public InitializeContent(contents: string): void 
    {
        for (let i = this._leftBoundary; i < this._leftBoundary + contents.length; i++)
        {
            this._tape.set(i, contents.charAt(i));
        }
    }

    public UpdateBoundaries(headPosition: number): void 
    {
        // Updates the boundary of the infinite side based on how far the heads are going
        if (this._tapeType === TapeTypes.LeftLimited)
        {
            this._rightBoundary = Math.max(this._rightBoundary, headPosition);
        }
        else if (this._tapeType === TapeTypes.RightLimited)
        {
            this._leftBoundary = Math.min(this._leftBoundary, headPosition);
        }
    }

    public GetContentsAsString()
    {
        let contents = "";

        if (this._tapeType === TapeTypes.LeftLimited || this._tapeType === TapeTypes.LeftRightLimited)
            contents += TapeSymbols.Start;

        for (let i = this._leftBoundary; i <= this._rightBoundary; i++) {
            if (this._tape.has(i))
                contents += this._tape.get(i)!;
            else
                contents += TapeSymbols.Blank;
        }

        if (this._tapeType === TapeTypes.RightLimited || this._tapeType === TapeTypes.LeftRightLimited)
            contents += TapeSymbols.End;

        return contents;
    }

    public GetSignalsAsString()
    {
        let signals = "";

        if (this._tapeType === TapeTypes.LeftLimited || this._tapeType === TapeTypes.LeftRightLimited)
            signals += TapeSymbols.Start;

        for (let i = this._leftBoundary; i <= this._rightBoundary; i++) {
            if (this._states.has(i))
                signals += this._states.get(i)!;
            else
                signals += TapeSymbols.Blank;
        }

        if (this._tapeType === TapeTypes.RightLimited || this._tapeType === TapeTypes.LeftRightLimited)
            signals += TapeSymbols.End;

        return signals;
    }
}