/**
 * Tape state: Content, left/right boundaries, and symbols (e.g., '_', '>', '<').
 */
class TapeState
{
    public ID: number = -1;
    public Content: string = "";
    public LeftBoundary: number = 0;
    public RightBoundary: number = 0;
}

/**
 * Head state: Position on its associated tape.
 */
class HeadState
{
    public TapeID: number = -1;
    public Position: number = 0;
}

/**
 * Machine state: Current state, heads (with tape references), and status.
 * Each machine has its own set of heads.
 */
class MachineState
{
    public ID: number = -1;
    public CurrentState: number = -1;
    public Heads: HeadState[] = [];
    public IsHalted: boolean = false;
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