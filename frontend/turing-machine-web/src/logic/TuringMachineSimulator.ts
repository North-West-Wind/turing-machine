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
import { TransitionNode } from "./States/Transitions/TransitionNode"
import { TransitionGraph } from "./States/Transitions/TransitionGraph"
import { SystemState } from "./SystemState"
import { TuringMachineFactory } from "./TuringMachineFactory"

class TuringMachineSimulator
{
    private static _machines: (TuringMachine | null)[] = [];
    private static _tapes: (ITape | null)[] = [];

    private static _nextTapeID: number = 0;
    private static _nextMachineID: number = 0;

    private static _isRunning: boolean = false;
    private static _runningNodes: TransitionNode[] = [];

    private static _originalMachineConfigs: (TuringMachineConfig | null)[] = [];
    private static _originalTapeConfigs: (TapeConfig | null)[] = [];

    private static _systemState: SystemState;

    /**
     * Adds a new tape to the system for simulating.
     * @param config The tape configuration.
     * @returns An ID to the newly created tape.
     * @throws {Error} when a new tape is inserted during simulation.
     */
    public static AddTape(config: TapeConfig): number
    {
        if (this._isRunning)
            throw new Error("Cannot insert new tape while simulating.");

        // Gets the current tape ID.
        const newTapeID = this._nextTapeID;

        // Makes the tape by factory.
        const tape = TuringMachineFactory.MakeTape(config);

        // Adds the new tape to the simulator, and stores the config for restoration later.
        this._tapes.push(tape);
        this._originalTapeConfigs.push(config);

        this._nextTapeID++;
        console.log(`Added a new tape with ID ${newTapeID}`)
        return newTapeID;
    }

    /**
     * Deletes an existing tape using tape IDs. @see {@link AddTape}.
     * @param tapeID The ID of the tape to be deleted.
     * @throws {RangeError} when the tape ID is invalid or the tape does not exist.
     * @throws {Error} when attempting to delete a tape during simulation or the tape is in use.
     */
    public static DeleteTape(tapeID: number): void
    {
        if (this._isRunning)
            throw new Error("Cannot delete a tape while simulating.");
      
        // Throw this when the tape ID is out of range or the tape does not exist.
        if (tapeID < 0 || tapeID >= this._tapes.length || this._tapes[tapeID] == null)
        {
            throw new RangeError( 
            `Tape with ID ${tapeID} does not exist or has already been deleted.`);
        }

        // Check if the tape is being used by any machine
        for (let machineID in this._machines)
        {
            const machine = this._machines[machineID];
            if (machine == null) continue;

            for (let head of machine.Heads)
            {
                if (head.IsUsesTape(this._tapes[tapeID]))
                {
                    throw new Error(
                        `Tape with ID ${tapeID} is in use by machine ${machineID}. Remove the machine first.`);
                }
            }
        }
    
       // Delete the tape by setting its slot to null
       this. _tapes[tapeID] = null;
       this._originalTapeConfigs[tapeID] = null;

       console.log(`Tape with ID ${tapeID} has been successfully deleted.`);
    }
}