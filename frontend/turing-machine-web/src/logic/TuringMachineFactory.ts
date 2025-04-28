import { ITape } from "./Tapes/ITape"
import { InfiniteTape } from "./Tapes/InfiniteTape"
import { TapeConfig } from "./Tapes/TapesUtilities/TapeConfig"
import { TapeTypes } from "./Tapes/TapeTypes"
import { TuringMachine } from "./TuringMachine"
import { TransitionStatement } from "./States/Transitions/TransitionStatement"
import { IHead } from "./Heads/IHead"
import { ReadWriteHead } from "./Heads/ReadWriteHead"
import { HeadTypes } from "./Heads/HeadTypes"
import { TuringMachineConfig } from "./TuringMachineConfig"
import { SignalState } from "./States/SignalStates"
import { TransitionGraph } from "./States/Transitions/TransitionGraph"
import { CircularTape } from "./Tapes/CircularTape"
import { LimitedTape } from "./Tapes/LimitedTape"
import { WriteOnlyHead } from "./Heads/WriteOnlyHead"
import { ReadOnlyHead } from "./Heads/ReadOnlyHead"

export class TuringMachineFactory
{
    /**
     * Method for simulator to make ITape objects.
     * @param config The configuration of the tape.
     * @throws {TypeError} when the tape type is invalid.
     * @throws {RangeError} when the tape length is invalid.
     */
    public static MakeTape(config: TapeConfig): ITape
    {
        if (config.TapeType == TapeTypes.Circular || config.TapeType == TapeTypes.LeftRightLimited)
        {
            if (config.TapeLength < 1)
            {
                throw new RangeError("Tape length must be greater than or equal to 1.")
            }

            if (config.TapeContent.length > config.TapeLength)
            {
                throw new RangeError(
                    `Content length ${config.TapeContent.length} exceeds tape length ${config.TapeLength}`)
            }
        }

        let newTape;
        switch (config.TapeType)
        {
            
            case TapeTypes.Infinite:
                newTape = new InfiniteTape(0, Math.max(0, config.TapeContent.length - 1));
                break;

            case TapeTypes.Circular:
                newTape = new CircularTape(0, Math.max(0, config.TapeLength - 1));
                break;

            case TapeTypes.LeftLimited:
                newTape = new LimitedTape(true, false, 0, Math.max(0, config.TapeContent.length - 1));
                break;

            case TapeTypes.RightLimited:
                newTape = new LimitedTape(false, true, 0, Math.max(0, config.TapeContent.length - 1));
                break;

            case TapeTypes.LeftRightLimited:
                newTape = new LimitedTape(true, true, 0, Math.max(0, config.TapeLength - 1));
                break;
                
            default:
                throw new Error(`Invalid tape type: ${config.TapeType}`);
        }

        newTape.InitializeContent(config.TapeContent);
        return newTape;
    }

    /**
     * Helper method to Populate the transition graph of the given machine.
     * @param machine The target Turing machine.
     * @param statements A list of transitions, represented by statement form.
     */
    private static PopulateTransitionGraph(
        machine: TuringMachine,
        statements: TransitionStatement[]
    ): void
    {
        for (let statement of statements)
        {
            machine.Graph.AddTransition(statement);
        }
    }

    /**
     * Helper method to Initialize all the heads of the given machine.
     * @param machine The target Turing machine. Allows multiple heads.
     * @param numberOfHeads The number of the heads.
     * @param headTypes The head types. Must have the same number of numberOfHeads.
     * @param initialPositions The initial head positions. Must have the same number of numberOfHeads.
     * @param tapesReference The tape ID the heads have reference at. Must have the same number of numberOfHeads.
     * @param tapes The tapes the heads have reference at. Must have the same number of numberOfHeads.
     */
    private static InitializeHeads(
        machine: TuringMachine,
        numberOfHeads: number,
        headTypes: HeadTypes[],
        initialPositions: number[],
        tapesReference: number[],
        tapes: ITape[]
    ): void
    {
        if (numberOfHeads <= 0 || headTypes.length <= 0 || tapes.length <= 0 || initialPositions.length <= 0)
            throw new RangeError("Must provide at least one initialized head.");

        if (headTypes.length != initialPositions.length 
            || headTypes.length != tapes.length 
            || headTypes.length != numberOfHeads)
            throw new Error("Arguments must have the same number of heads.");

        // Pushes an array of IHeads to the given machine
        for (let i = 0; i < numberOfHeads; i++) {
            let head: IHead;

            switch (headTypes[i]) {
                case HeadTypes.ReadWrite:
                    head = new ReadWriteHead(tapes[i]);
                    break;
                case HeadTypes.WriteOnly:
                    head = new WriteOnlyHead(tapes[i]);
                    break;
                case HeadTypes.ReadOnly:
                    head = new ReadOnlyHead(tapes[i]);
                    break;
                default:
                    throw new Error(`Invalid head type: ${headTypes[i]}`);
            }

            head.Position = initialPositions[i];
            head.TapeID = tapesReference[i];
            machine.Heads.push(head);
        }
    }

    public static MakeTuringMachine(config: TuringMachineConfig, tapes: ITape[]): TuringMachine
    {
        const machine = new TuringMachine();
        machine.IsHalted = false;
        machine.Signal = SignalState.Blue;
        machine.Graph = new TransitionGraph();
        this.InitializeHeads(machine, config.NumberOfHeads, config.HeadTypes, config.InitialPositions, config.TapesReference, tapes);
        this.PopulateTransitionGraph(machine, config.Statements);

        return machine;
    }
}