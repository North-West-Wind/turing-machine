import { IHead } from "./IHead"
import { HeadTypes } from "./HeadTypes"
import { ITape } from "../Tapes/ITape"

export class ReadWriteHead implements IHead
{
    // Getter for the head type
    public get Type(): HeadTypes {
        return HeadTypes.ReadWrite;
    }

    public Position: number = 0;
    public TapeID: number = 0;

    private readonly _useTape: ITape;

    /**
     * ReadWriteHead constructor accepts a tape object for operations. Cannot change later.
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

    public TryWrite(content: string, machineID: number, headID: number): boolean
    {
        try 
        {
            this._useTape.ScheduleWrite(this.Position, content, machineID, headID);
        }
        catch (ex)
        {
            if (ex instanceof Error) {
                console.log(ex.message); // Safely access the message property
            } else {
                console.log("An unknown error occurred.");
            }

            return false;
        }

        return true;
    }

    public IsUsesTape(tape: ITape): boolean {
        return tape === this._useTape;
    }
}