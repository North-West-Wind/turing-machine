import { TransitionNode } from "./TransitionNode"

/** The transition one head should perform. */
export class HeadTransition
{
    public readonly Read: string = "";
    public readonly Write: string = "";
    public readonly Move: number = 0;

    constructor(read: string, write: string, move: number)
    {
        this.Read = read;
        this.Write = write;
        this.Move = move;
    }
}

/** 
 * TransitionStatement represents one possible transitions for all heads.
 * This data structure is not used for simulation, but only a simpler representation for UI.
 */
export class TransitionStatement
{
    public readonly Source: TransitionNode;
    public readonly Target: TransitionNode;
    public readonly Conditions: HeadTransition[];

    /** Constructor to create a new statement. All built by UI. */
    constructor(source: TransitionNode, target: TransitionNode, conditions: HeadTransition[])
    {
        this.Source = source;
        this.Target = target;
        this.Conditions = conditions;
    }
}