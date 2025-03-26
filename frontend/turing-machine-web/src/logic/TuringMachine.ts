import { TransitionGraph } from "./States/Transitions/TransitionGraph";
import { SignalState } from "./States/SignalStates";
import { IHead } from "./Heads/IHead"

export class TuringMachine {
    // Direct sets are not allowed, but for simplicity, it is exposed to all classes
    public Heads!: IHead[];
    public Graph!: TransitionGraph;
    public State!: SignalState;
    public IsHalted!: boolean;
}