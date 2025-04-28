export class TransitionNode
{
    // More fields, e.g. IsFinal, can be easily added in the future.
    public readonly StateID: number;

    /**
     * Sets the stateID to this node.
     */
    constructor(stateID: number)
    {
        this.StateID = stateID;
    }

    /**
     * Defines a custom hash function for mapping.
     * @returns The stateID of the node. This is unique enough.
     */
    public GetHashCode(): number {
        // Use stateID as the unique identifier
        return this.StateID;
    }

    /**
     * Defines a custom comparsion method to check if it is the same node.
     * @returns true if it the same, false otherwise.
     */
    public Equals(obj: unknown): boolean {
        // Check if obj is an instance of TransitionNode and compare stateIDs
        return obj instanceof TransitionNode && this.StateID === obj.StateID;
    }
}