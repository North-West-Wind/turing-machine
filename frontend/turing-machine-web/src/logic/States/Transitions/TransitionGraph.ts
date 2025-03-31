import { TransitionNode } from "./TransitionNode"
import { TransitionStatement } from "./TransitionStatement"
import { getStringHash } from "./djb2hash";

/**
 * Each transitions depend on knowing the source node and the read string (from each head).
 */
export class TransitionKey
{
    public Source: TransitionNode;

    // This concats each single character from each head.
    public HeadsReads: string;

    constructor(source: TransitionNode, headsReads: string)
    {
        this.Source = source;
        this.HeadsReads = headsReads;
    }

    /**
     * Defines a custom hash function for mapping.
     * @returns The hash value of the transition key.
     */
    public GetHashCode(): number
    {
        let hash = 17;
        hash = hash * 31 + (this.Source?.GetHashCode() ?? 0);
        hash = hash * 31 + (this.HeadsReads ? getStringHash(this.HeadsReads) : 0);

        return hash;
    }

    /**
     * Defines a custom comparsion method to check if it is the same key.
     * @returns true if it the same, false otherwise.
     */
    public Equals(obj: unknown): boolean
    {
        if (!(obj instanceof TransitionKey))
            return false;
        

        return this.Source.Equals(obj.Source) && 
               this.HeadsReads === obj.HeadsReads;
    }
}

/**
 * The possible move upon reading the string.
 */
export class TransitionValue
{
    public Target: TransitionNode;

    // This concats each single character from each head.
    public HeadsWrites: string;

    public HeadsMoves: number[];

    constructor(target: TransitionNode, headsWrites: string, headsMoves: number[])
    {
        this.Target = target;
        this.HeadsWrites = headsWrites;
        this.HeadsMoves = headsMoves;
    }
}

/**
 * Stores a collection of transition nodes.
 * Maps TransitionKey to TransitionValues. The relation must be 1 to 0..1.
 */
export class TransitionGraph
{
    // 
    private _transitions: Map<number, TransitionValue> = new Map();

    /**
     * Accepts a transition statement from UI. Add it to the graph.
     * @param statement A transition statement. @see {@link TransitionStatement}
     * @throws {RangeError} when the read or write content has length not equal to 1.
     */
    public AddTransition(statement: TransitionStatement): void
    {
        let headsReads = "";
        let headsWrites = "";
        let headsMoves = [];

        for (let headTransition of statement.Conditions)
        {
            if (headTransition.Read.length != 1 || headTransition.Write.length != 1)
                throw new RangeError("Read or write content has length not equal to 1.")

            headsReads += headTransition.Read;
            headsWrites += headTransition.Write;
            headsMoves.push(headTransition.Move);
        }

        const key = new TransitionKey(statement.Source, headsReads);
        const value = new TransitionValue(statement.Target, headsWrites, headsMoves);

        // Try to add this statement. Do nothing if it already exists.
        if (!this._transitions.has(key.GetHashCode()))
            this._transitions.set(key.GetHashCode(), value);
    }

    /**
     *  For simulator to try to get the value of transition.
     * @param key TransitionKey object. The transition condition.
     * @returns A boolean value indicating exists or not. If yes, returns the value.
     */
    public TryGetTransitionValue(key: TransitionKey): { success: boolean; value: TransitionValue | null }
    {
        if (this._transitions.has(key.GetHashCode()))
            return {success: true, value: this._transitions.get(key.GetHashCode())!};
        
        return {success: false, value: null};
    }
}