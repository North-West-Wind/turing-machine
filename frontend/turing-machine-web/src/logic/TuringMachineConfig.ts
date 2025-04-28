import { HeadTypes } from "./Heads/HeadTypes";
import { TransitionNode } from "./States/Transitions/TransitionNode"
import { TransitionStatement } from "./States/Transitions/TransitionStatement"

export class TuringMachineConfig {
    public NumberOfHeads: number;
    public HeadTypes: HeadTypes[];
    public InitialPositions: number[];
    public TapesReference: number[];
    public TransitionNodes: TransitionNode[];
    public Statements: TransitionStatement[];
    public StartNode: TransitionNode;

    /**
     * Constructor for creating a machine configuration.
     */
    constructor(
        numberOfHeads: number,
        headTypes: HeadTypes[],
        initialPositions: number[],
        tapesReference: number[],
        transitionNodes: TransitionNode[],
        statements: TransitionStatement[],
        startNode: TransitionNode
    ) {
        this.NumberOfHeads = numberOfHeads;
        this.HeadTypes = headTypes;
        this.InitialPositions = initialPositions;
        this.TapesReference = tapesReference;
        this.TransitionNodes = transitionNodes;
        this.Statements = statements;
        this.StartNode = startNode;
    }
}