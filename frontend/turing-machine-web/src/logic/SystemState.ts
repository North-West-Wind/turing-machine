import { SignalState } from "./States/SignalStates";

/**
 * Tape state: Content, left/right boundaries, and symbols (e.g., '_', '>', '<').
 */
export class TapeState
{
    public ID: number = -1;
    public Content: string = "";
    public TapeSignal: string = "";
    public LeftBoundary: number = 0;
    public RightBoundary: number = 0;

    constructor(id: number, content: string, tapeSignal: string, leftBoundary: number, rightBoundary: number)
    {
        this.ID = id;
        this.Content = content;
        this.TapeSignal = tapeSignal;
        this.LeftBoundary = leftBoundary;
        this.RightBoundary = rightBoundary;
    }
}

/**
 * Head state: Position on its associated tape.
 */
export class HeadState
{
    public TapeID: number = -1;
    public Position: number = 0;

    constructor(tapeID: number, position: number)
    {
        this.TapeID = tapeID;
        this.Position = position
    }
}

/**
 * Machine state: Current state, heads (with tape references), and status.
 * Each machine has its own set of heads.
 */
export class MachineState
{
    public ID: number = -1;
    public CurrentState: number = -1;
    public Heads: HeadState[] = [];
    public IsHalted: boolean = false;
    public Signal: number;

    constructor(id: number, currentState: number, isHalted: boolean, signal: SignalState)
    {
        this.ID = id;
        this.CurrentState = currentState;
        this.IsHalted = isHalted;
        this.Signal = signal;
    }
}

/**
 * A user-friendly encapsulation of the whole system state. For UI.
 * May support string format in the future. 
 */
export class SystemState
{
    // Tapes are shared globally, so track their contents and boundaries.
    public Tapes: TapeState[] = [];

    public Machines: MachineState[] = [];
}