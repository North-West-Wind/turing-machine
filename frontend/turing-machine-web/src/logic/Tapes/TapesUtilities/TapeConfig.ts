import { TapeTypes } from "../TapeTypes"

export class TapeConfig
{
    public readonly TapeType: TapeTypes;
    public readonly TapeLength: number;
    public readonly TapeContent: string;

    /**
     * Constructor for configurating a tape.
     */
    constructor(tapeType: TapeTypes, tapeLength: number, tapeContent: string)
    {
        this.TapeType = tapeType;
        this.TapeLength = tapeLength;
        this.TapeContent = tapeContent;
    }

}