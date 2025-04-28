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
     * Note: this symbol might be dangerous, but the system won't actually write this symbol
     */
    static readonly None: string = '/';


    /**
     * Running symbol, the machine that reads this resumes from pause
     * Note: Use symbol that won't appear in normal content
     */
    static readonly Running: string = '\u0001';


    /**
     * Running symbol, the machine that reads this resumes from pause
     * Note: Use symbol that won't appear in normal content
     */
    static readonly Pause: string = '\u0002';
}