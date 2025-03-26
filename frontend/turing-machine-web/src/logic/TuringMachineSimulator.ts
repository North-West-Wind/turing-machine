import { ITape } from "./Tapes/ITape"
import { TapeConfig } from "./Tapes/TapesUtilities/TapeConfig"
import { TuringMachine } from "./TuringMachine"
import { TuringMachineConfig } from "./TuringMachineConfig"
import { TransitionNode } from "./States/Transitions/TransitionNode"
import { TransitionKey } from "./States/Transitions/TransitionGraph"
import { HeadState, MachineState, SystemState, TapeState } from "./SystemState"
import { TuringMachineFactory } from "./TuringMachineFactory"

export class TuringMachineSimulator
{
    private static _machines: (TuringMachine | null)[] = [];
    private static _tapes: (ITape | null)[] = [];

    private static _nextTapeID: number = 0;
    private static _nextMachineID: number = 0;

    private static _isRunning: boolean = false;
    private static _runningNodes: (TransitionNode | null)[] = [];

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
        const newTape = TuringMachineFactory.MakeTape(config);

        // Adds the new tape to the simulator, and stores the config for restoration later.
        this._tapes.push(newTape);
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
     * 
     * @example
     * const tapeID1 = TuringMachineSimulator.AddTape(tapeConfig1);
     * TuringMachineSimulator.DeleteTape(tapeID1);
     */
    public static DeleteTape(tapeID: number): void
    {
        if (this._isRunning)
            throw new Error("Cannot delete a tape while simulating.");
      
        // Throws this when the tape ID is out of range or the tape does not exist.
        if (tapeID < 0 || tapeID >= this._tapes.length || this._tapes[tapeID] == null)
        {
            throw new RangeError( 
            `Tape with ID ${tapeID} does not exist or has already been deleted.`);
        }

        // Checks if the tape is being used by any machine
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
    
       // Deletes the tape by setting its slot to null
       this. _tapes[tapeID] = null;
       this._originalTapeConfigs[tapeID] = null;

       console.log(`Tape with ID ${tapeID} has been successfully deleted.`);
    }

    /**
     * Adds a new Turing Machine for simulating.
     * @param config The machine configuration.
     * @returns An ID to the newly created machine.
     * @throws {Error} when a new Turing machine is inserted during simulation.
     * @throws {Error} when the tape referencing does not exist
     */
    public static AddMachine(config: TuringMachineConfig): number
    {
        if (this._isRunning)
            throw new Error(
                "Cannot insert new machine while simulating. Please reset the machine before adding new ones.");

        const newMachineID = this._nextMachineID;

        // Converts the tape reference to ITape objects
        const useTapes: ITape[] = config.TapesReference.map(tapeID => {
            const tape = this._tapes[tapeID];
            if (tape === null || tape === undefined) {
                throw new Error(`Missing tape reference for ID: ${tapeID}`);
            }
            return tape;
        });

        // Sets start state
        this._runningNodes.push(config.StartNode);
        
        // Adds the new machine to the simulator, and stores the config for restoration later
        const newMachine = TuringMachineFactory.MakeTuringMachine(config, useTapes);
        this._machines.push(newMachine);
        this._originalMachineConfigs.push(config);

        this._nextMachineID++;
        console.log(`Added a new machine with ID ${newMachineID}`);
        return newMachineID;
    }

    /**
     * Deletes an existing Turing Machine using machine ID. @see {@link AddMachine}.
     * @param machineID The ID of the machine to be deleted.
     * @throws {RangeError} when the machine ID is invalid or the machine does not exist.
     * @throws {Error} when attempting to delete a machune during simulation.
     * 
     * @example @see {@link DeleteTape}
     */
    public static DeleteMachine(machineID: number): void
    {
        if (this._isRunning)
            throw new Error(
                "Cannot delete a machine while the simulation is running. Stop the simulation first.");

        // Throws this when deleting a non-existent Turing machine
        if (this._machines[machineID] == null || machineID < 0 || machineID >= this._machines.length)
            throw new RangeError(
                `Machine with ID ${machineID} does not exist or is already deleted.`);

        // Deletes the machine by setting its slot to null.
        this._machines[machineID] = null;
        this._runningNodes[machineID] = null;
        this._originalMachineConfigs[machineID] = null;
        
        console.log(`Machine with ID ${machineID} has been successfully deleted.`);
    }

    /**
     * Initializes the simulation environment with a COMPLETE RESET.
     * 
     * WARNING: This is NOT for restarting a simulation!
     * - Clears ALL tapes, machines, and internal state
     * - You MUST re-add tapes and machines after calling this
     */
    public static Initialise(): void
    {
        // Clear existing machines and tapes
        this._machines.length = 0;
        this._tapes.length = 0;
        this._originalMachineConfigs.length = 0;
        this._originalTapeConfigs.length = 0;

        // Clear counters
        this._nextTapeID = 0;
        this._nextMachineID = 0;

        // Clear simulation state
        this._isRunning = false;
        this._runningNodes.length = 0;
        
        console.log("Initialised successfully! Add your tapes and machines to start!");
    }

    /**
     * Resets the simulation to its original state. For UI to restart a simulation.
     * Do not confuse this method with {@link Initialise}.
     * 
     * @throws {Error} when resetting during simulation.
     */
    public static Reset(): void
    {
        if (this._isRunning)
            throw new Error("Cannot reset while running. Please stop the simulation first.");

        this._machines.length = 0;
        this._tapes.length = 0;
        this._runningNodes.length = 0;

        // Restores tapes from original configs while preserving IDs
        this._tapes = this._originalTapeConfigs.map(config => 
            config ? TuringMachineFactory.MakeTape(config) : null
        );

        // Restores machines from original configs while preserving IDs
        for (const config of this._originalMachineConfigs)
        {
            if (config) 
            {
                // Converts the tape reference to ITape objects
                const useTapes: ITape[] = config.TapesReference
                    .map(tapeID => this._tapes[tapeID])
                    .filter((tape): tape is ITape => tape !== null && tape !== undefined);
        
                // Recreates the machine
                const machine = TuringMachineFactory.MakeTuringMachine(config, useTapes);
                this._machines.push(machine);
        
                // Sets the start state
                this._runningNodes.push(config.StartNode);
            } 
            else {
                // Handles null configs
                this._machines.push(null);
                this._runningNodes.push(null);
            }
        }

        console.log("Reset successfully!");
    }

    /**
     * Starts the simulation. After invoking this method, no more add or delete is allowed.
     */
    public static StartSimulation(): void
    {
        this._isRunning = true;
        console.log("Simulation started.");
    }

    /**
     * Stops the simulation manually. It is useful when the machine gets into an infinite loop.
     */
    public static StopSimulation(): void
    {
        this._isRunning = false;
        console.log("Simulation is stopped manually.");
    }

    /**
     * Simulates one step for each machine. For users to view the simulation step by step.
     */
    public static Update(): void
    {
        // Sliently returns when the simulation ends
        if (!this._isRunning) return;

        let hasUpdated = false;

        for (let machineID = 0; machineID < this._machines.length; machineID++)
        {
            const machine = this._machines[machineID];

            if (machine == null || machine.IsHalted)
                continue;

            // Step 1: Heads read the content from their operating tapes
            let readContents: string = "";
            for (let head of machine.Heads)
            {
                readContents += head.GetCurrentContent();
            }

            // Step 2: Create a key to look up the transition
            const key = new TransitionKey(this._runningNodes[machineID]!, readContents);

            const result = machine.Graph.TryGetTransitionValue(key);

            if (!result.success) {
                console.log(`Machine ${machineID} has no transition value and hence halts.`);
                machine.IsHalted = true;
                continue;
            }

            // TransitionValue is safely extracted if success is true
            const value = result.value!;

            this._runningNodes[machineID] = value.Target;
            let writeContents: string = value.HeadsWrites;
            let headMoves: number[] = value.HeadsMoves;

            // Step 3: Write contents and moves
            let headWriteMovesIndex = 0;
            for (let head of machine.Heads)
            {
                if (!head.TryWrite(writeContents[headWriteMovesIndex],
                    machineID, headWriteMovesIndex))
                {
                    console.log(`Multiple/Invalid write operations failed. Machine ${machineID} halts.`);
                    machine.IsHalted = true;
                    break;
                }

                head.Move(headMoves[headWriteMovesIndex]);
                this._tapes[head.TapeID]!.UpdateBoundaries(head.Position);

                headWriteMovesIndex++;
            }

            hasUpdated = true;
        }

        // Finally, update the tape contents
        if (hasUpdated) {
            for (let tape of this._tapes)
            {
                if (tape != null)
                    tape.CommitWrite();
            }
        }
        else {
            this._isRunning = false;
            console.log("Simulation finished. Please reset the system before continuing.");
        }
    }

    /**
     * Updates the system state. When UI trys to get the system state, this will be automatically called.
     */
    private static UpdateSystemState(): void
    {
        const state = new SystemState();

        // Step 1: Handle tapes with boundaries and symbols
        for (let tapeID = 0; tapeID < this._tapes.length; tapeID++)
        {
            if (this._tapes[tapeID] == null)
                continue;
                
            const tape = this._tapes[tapeID];
            const tapeState = new TapeState(
                tapeID,
                tape!.GetContentsAsString() ?? "(null)",
                tape!.LeftBoundary,
                tape!.RightBoundary
            )

            state.Tapes.push(tapeState);
        }

        // Step 2: Handle machines with explicit head-tape relationships
        for (let machineID = 0; machineID < this._machines.length; machineID++)
        {
            const machine = this._machines[machineID];

            if (machine == null)
                continue;

            const machineState = new MachineState(
                machineID,
                this._runningNodes[machineID]!.StateID,
                machine.IsHalted
            );

            for (let head of machine.Heads)
            {
                const headState = new HeadState(
                    head.TapeID,
                    head.Position
                );

                machineState.Heads.push(headState);
            }

            state.Machines.push(machineState);
        }

        this._systemState = state;
    }

    /**
     * Gets the system state. For UI.
     * Automatically update the latest system state. @see {@link UpdateSystemState}
     * 
     * @returns The latest system state.
     */
    public static GetSystemState(): SystemState
    {
        this.UpdateSystemState();
        return this._systemState;
    }

    /**
     * Simulates the Turing Machines as quickly as possible.
     * Notes: Ignores MSPT during simulation.
     * @param ticks How many ticks (steps) to super-hot with.
     */
    public static SuperHot(ticks: number): void
    {
        for (let i = 0; i < ticks; i++)
        {
            this.Update();
        }
    }
}