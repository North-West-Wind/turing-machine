# Logic

This section introduces the core game logic that drives the system.

## Overview

In our project, C# is used as a temporary game development language and TS will be ported to the frontend to provide necessary optimisation.

At this stage, the core simulator has been ported to frontend, where it achieves:

 - Infinite tapes and read write heads (standard model)
 - Strongly-typed configurations of tapes and machines
 - Reset, step by step simulation
 - Dynamic add and delete of machines/tapes
 - System state feedbacks
 - Variants of tapes

 As for the requirement, only variants of heads and state control are still in progress.

## Structure

The main structure of this component is similar to the previous two implementations. [[Turing_Machine_Simulation_Old]](https://github.com/fungusan/Turing_Machine_Simulation_Old)

The entities in the system includes ``/Head``, ``/Tape`` and ``TuringMachine.ts``. 

The system introduces two configuration class for making tapes and machines: ``/Tape/TapesUtilities/TapeConfig.ts`` and ``TuringMachineConfig.ts``.

Finally, you find the main simulator in ``TuringMachineSimulator.ts``.

## Usage

The only files UI need to interact with are:

- Configuration files: ``.../TapeConfig.ts``, ``TuringMachineConfig.ts``
- Simulator: ``TuringMachineSimulator.ts``
- The system state: ``SystemState.ts``.

Unlike the standard model, the system will support multiple machines, tapes and heads. System state is defined as a package of all machine states, tape states, etc.

### Configurations
To support easy configurations, the system will provide a configuration format for adding tapes and machines to the simulator.

Currently, it only supports strongly-typed configuration, meaning the inputs must match the defined types (e.g. ``TransitionNode`` and ``TransitionStatement``). A string based input might be developed later if the requirement updates.

```ts
// example tape config
const tapeConfig = new TapeConfig(
	TapeTypes.Infinite,
	-1, // tape length, infinite tape will ignore
	"aabba"  // tape content
);

// example machine config
let transitionNodes = [];
const machineConfig = new TuringMachineConfig(
	1, // number of heads
	[HeadTypes.ReadWrite], // head types
	[0], // initial positions
	[0], // tape references
	transitionNodes  = [new  TransitionNode(0)], // transition nodes
	[new  TransitionStatement(transitionNodes[0], transitionNodes[0], [new  HeadTransition('a', 'b', 1)])], // transition statements
	transitionNodes[0] // start node
);
```
After defining the configurations, you can add the corresponding tapes or machines to the system:

```ts
const tapeID = TuringMachineSimulator.AddTape(tapeConfig0);
const machineID = TuringMachineSimulator.AddMachine(machineConfig0);
```
You can also delete the tapes and machines:

```ts
TuringMachineSimulator.DeleteTape(tapeID); // Delete by ID
TuringMachineSimulator.DeleteMachine(machineID); // Delete by ID
```
Please note that, after the simulation is started, there should be no more adding or deleting of entities. But you may still define new configurations.

### Simulation

To prepare a simulation, you should always call ``Initialise()`` to remove the unwanted state, tapes and machines from previous simulations. This method itself does not start a simulation, but a complete reset of the whole system. DO NOT confuse this method with ``Reset()``, which is for restarting a configured simulations.

After all the entities are in place, you should call ``StartSimulation()``. This method will signalise the simulator to start the simulation, and prohibit any change to the configurations.

To perform simulation, there are two methods available

- ``Update()``: Simulates one step for each machine. For users to view the simulation step by step.
- ``SuperHot(tick: number)``:  Simulates  as quickly as possible, does ``tick`` steps.

There will be no feedback of simulation unless the simulator receives an explicit call of ``GetSystemState()``, which updates the internal state and returns UI a ``SystemState`` object. You can then unpack the object and extract the simulation information.

Full example walkthrough:
```ts
TuringMachineSimulator.Initialise();
TuringMachineSimulator.AddTape(tapeConfigs[0]);
TuringMachineSimulator.AddTape(tapeConfigs[1]);
TuringMachineSimulator.AddMachine(machineConfig);
TuringMachineSimulator.StartSimulation();

TuringMachineSimulator.Update();
let currentSystemState = TuringMachineSimulator.GetSystemState();

// currentSystemState.Machines[0].CurrentState = 1
// currentSystemState.Tapes[0].Content = "0101110"
// currentSystemState.Tapes[1].Content = "210"
  
TuringMachineSimulator.Update();
// The same as doing Update() thrice
TuringMachineSimulator.SuperHot(3); 

// Normally, if all machines halt, the simulator will stop itself
// In case the machine stucks in an infinite loop, you can stop manually.
TuringMachineSimulator.StopSimulation();

// Restart the simulation
TuringMachineSimulator.Reset();
// You can add and delete tapes and machines now

TuringMachineSimulator.Update();
currentSystemState = TuringMachineSimulator.GetSystemState();

// currentSystemState.Machines[0].CurrentState = 1
// currentSystemState.Tapes[0].Content = "0101110"
// currentSystemState.Tapes[1].Content = "210"

// To start over
TuringMachineSimulator.Initialise();
```

If you are still unsure about the simulations, you can refer to ``/test/simulator.test.ts`` to look at the test cases.

### Tape Content Format Specification

The tape contents are represented in string with indexed positions. Two key metadata fields define the positions:

- ``LeftBoundary``: Starting index of the content window
- ``RightBoundary``: Ending index of the content window

Examples:
```ts
Tape 0 (InfiniteTape) content: "cbaabd"
Tape 0 LeftBoundary: 0
Tape 0 RightBoundary: 5
// 'c' is at position 0, 'd' is at position 5
// Note: Infinite tapes have no real boundaries,
// these indices represent the current visible window

Tape 1 (InfiniteTape) content: "ab__aabd__ac"
Tape 1 LeftBoundary: -3
Tape 1 RightBoundary: 8
// First 'a' is at position -3, 'c' is at position 8
// To read head position 4: content[4 - (-3)] = content[7] (which is 'd')

Tape 2 (CircularTape) content: ">10112<"
Tape 2 LeftBoundary: 0
Tape 2 RightBoundary: 4
// Data ranges from position 0 ('1') to 4 ('2')
// '>' and '<' mark the real tape boundaries

Tape 3 (LeftLimitedTape) content: ">__112344"
Tape 3 LeftBoundary: 0
Tape 3 RightBoundary: 7
/// '>' marks permanent left boundary at position 0
// First data '1' is at position 2, last '4' at position 7
// Underscores represent blank
```

## Side Note

Feedbacks are welcomed to the implementation of TS logic!