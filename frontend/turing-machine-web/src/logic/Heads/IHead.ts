import { HeadTypes } from "./HeadTypes"
import { ITape } from "../Tapes/ITape"
import { SignalState } from "../States/SignalStates";

export interface IHead 
{
    readonly Type: HeadTypes;
    Position: number;
    TapeID: number;

    /**
     * Gets the content in the current position of the head.
     * @returns Returns the read content. Can be null when out of bound.
     */
    GetCurrentContent(): string | null;

    /**
     * Receives the control signal in the current position from the tape.
     * @returns Returns the control signal. Receive Other if no state is written.
     */
    ReceiveSignal(): SignalState;

    /**
     * Moves the head. No effects to the tape.
     * @param steps: Moves this number of steps. Can be negative or zero.
     */
    Move(steps: number): void;

    /**
     * Tries to write a content into a cell on the tape
     * @param content The write content. It must be a single character.
     * @param machineID The machine that is going to write.
     * @param headID The machine head that is going to write.
     * @returns A boolean value indicating success or not.
     */
    TryWrite(content: string, machineID: number, headID: number): boolean;

    /**
     * Removes the signal from the tape.
     */
    TakeOutSignal(): void;

    /**
     * Checks if the head is using the given tape.
     * @returns True if the given ITape object is the same as the one this head is using, False otherwise.
     */
    IsUsesTape(tape: ITape): boolean;
}