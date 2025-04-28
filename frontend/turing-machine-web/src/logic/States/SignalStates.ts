export enum SignalState
{
    /**
     * No state
     */
    Other,

    /**
     * Running singal, indicating that the machine is running
     */
    Green,

    /**
     * Pause singal, indicating that the machine is not running (but not halted)
     */
    Orange,

    /**
     * Halt singal, indicating that the machine halted, and will not resume
     */
    Red,

    /**
     * Ready singal, indicating that the machine is ready to run
     */
    Blue,
}