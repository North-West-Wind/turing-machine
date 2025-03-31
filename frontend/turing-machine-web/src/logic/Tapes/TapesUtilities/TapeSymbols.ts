export class TapeSymbols {
    /**
     * Empty content, the default value of the tape. Notes: the tape doesn't actually store it
     */
    static readonly Blank: string = '_';


    /**
     * Start symbol, for left limited tapes
     */
    static readonly Start: string = '>';


    /**
     * End symbol, for right limited tapes
     */
    static readonly End: string = '<';

    
    /**
     * None symbol, for read/write only heads
     */
    static readonly None: string = '/';
}