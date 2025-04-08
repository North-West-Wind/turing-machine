import { IHead } from "./IHead"
import { HeadTypes } from "./HeadTypes"
import { ITape } from "../Tapes/ITape"
import { TapeSymbols } from "../Tapes/TapesUtilities/TapeSymbols";

export class ReadOnlyHead implements IHead
{
    // Getter for the head type
    public get Type(): HeadTypes {
        return HeadTypes.ReadOnly;
    }

    public Position: number = 0;
    public TapeID: number = 0;

    private readonly _useTape: ITape;

    /**
     * ReadOnlyHead constructor accepts a tape object for operations. Cannot change later.
     * Factory method should pass this object by the given tape reference ID.
     * @param tape An ITape object.
     */
    constructor(tape: ITape)
    {
        this._useTape = tape;
    }

    public GetCurrentContent(): string | null 
    {
        const { success, content } = this._useTape.TryRead(this.Position);

        if (success)
            return content;
        else
            return null;
    }

    public Move(steps: number): void
    {
        this.Position = this._useTape.GetMovedPosition(this.Position, steps);
    }

    public TryWrite(content: string): boolean
    {
        // ReadOnlyHead does not allow any write operation
        // Returns false if the statement is configurated incorrectly
        if (content != TapeSymbols.None)
            return false;

        return true;
    }

    public IsUsesTape(tape: ITape): boolean {
        return tape === this._useTape;
    }
}