import { expect, test } from 'vitest'
import { TuringMachineConfig } from '../TuringMachineConfig';
import { TuringMachineFactory } from '../TuringMachineFactory';
import { TuringMachineSimulator } from '../TuringMachineSimulator'
import { TapeConfig } from '../Tapes/TapesUtilities/TapeConfig';
import { TapeTypes } from '../Tapes/TapeTypes';
import { HeadTypes } from '../Heads/HeadTypes';
import { TransitionNode } from '../States/Transitions/TransitionNode';
import { HeadTransition, TransitionStatement } from '../States/Transitions/TransitionStatement';
import { TapeSymbols } from '../Tapes/TapesUtilities/TapeSymbols';

test('Test case 1: Create valid tape and Turing machine configs.', () => {
    const tapeConfig = new TapeConfig(
        TapeTypes.Infinite,
        -1, // tape length, infinite tape will ignore
        "aabba" // tape content
    )

    let transitionNodes = [];
    const machineConfig = new TuringMachineConfig(
        1,  // number of heads
        [HeadTypes.ReadWrite],  // head types
        [0],    // initial positions
        [0],    // tape references
        transitionNodes = [new TransitionNode(0)],    // transition nodes
        [new TransitionStatement(transitionNodes[0], transitionNodes[0], [new HeadTransition('a', 'b', 1)])], // transition statements
        transitionNodes[0] // start node
    )

    expect(tapeConfig.TapeContent).toBe("aabba");
    expect(machineConfig.HeadTypes).toStrictEqual([HeadTypes.ReadWrite]);

    expect(machineConfig.Statements).toHaveLength(1);
    expect(machineConfig.Statements[0].Conditions[0].Read).toBe('a');
    expect(machineConfig.NumberOfHeads).toBe(1);
    expect(machineConfig.StartNode).toBe(transitionNodes[0]);
})

test('Test case 2: Add invalid tape and Turing machine configs in factory.', () => {
    const tapeConfig = new TapeConfig(
        TapeTypes.Circular,
        -1, // tape length, infinite tape will ignore
        "" // tape content
    )

    const emptyMachineConfig = new TuringMachineConfig(0, [], [], [], [], [], null!);

    expect(() => TuringMachineFactory.MakeTape(tapeConfig))
        .toThrowError();

    expect(() => TuringMachineSimulator.AddMachine(emptyMachineConfig))
        .toThrowError();
})

test('Test case 3: Add and delete valid tape and machines to the simulator.', () => {
    const tapeConfig0 = new TapeConfig(
        TapeTypes.Infinite,
        -1, // tape length, infinite tape will ignore
        "aabba" // tape content
    )

    let transitionNodes = [];
    const machineConfig0 = new TuringMachineConfig(
        1,  // number of heads
        [HeadTypes.ReadWrite],  // head types
        [0],    // initial positions
        [1],    // tape references
        transitionNodes = [new TransitionNode(0)],    // transition nodes
        [new TransitionStatement(transitionNodes[0], transitionNodes[0], [new HeadTransition('a', 'b', 1)])], // transition statements
        transitionNodes[0] // start node
    )

    expect(TuringMachineSimulator.AddTape(tapeConfig0)).toBe(0);
    TuringMachineSimulator.DeleteTape(0);
    expect(TuringMachineSimulator.AddTape(tapeConfig0)).toBe(1);
    expect(TuringMachineSimulator.AddMachine(machineConfig0)).toBe(0);

    const tapeConfig1 = new TapeConfig(
        TapeTypes.Infinite,
        -1, // tape length, infinite tape will ignore
        "bcbcc" // tape content
    )

    const machineConfig1 = new TuringMachineConfig(
        2,  // number of heads
        [HeadTypes.ReadWrite, HeadTypes.ReadWrite],  // head types
        [0, 2],    // initial positions
        [0, 0],    // tape references
        transitionNodes = [new TransitionNode(0)],    // transition nodes
        [new TransitionStatement(transitionNodes[0], transitionNodes[0], 
            [new HeadTransition('a', 'b', 1), new HeadTransition('b', 'b', -1)])], // transition statements
        transitionNodes[0] // start node
    )

    expect(TuringMachineSimulator.AddTape(tapeConfig1)).toBe(2);
    expect(() => TuringMachineSimulator.AddMachine(machineConfig1)) // expecting non-existent tape error
        .toThrowError();

    TuringMachineSimulator.DeleteMachine(0);
    expect(TuringMachineSimulator.AddMachine(machineConfig0)).toBe(1);
})

test('Test case 4: Standard simulation and reset test.', () => {
    const tapeConfigs = [
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            "1101110"
        ),
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            "_10"
        ),
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            ""
        )
    ];
    
    let transitionNodes: TransitionNode[] = [];
    const machineConfig = new TuringMachineConfig(
        2,
        [HeadTypes.ReadWrite, HeadTypes.ReadWrite],
        [0, 0],
        [0, 1],
        transitionNodes = [
            new TransitionNode(0),
            new TransitionNode(1),
            new TransitionNode(2)
        ],
        [
            new TransitionStatement(
                transitionNodes[0],
                transitionNodes[1],
                [
                    new HeadTransition('1', '0', 1),
                    new HeadTransition(TapeSymbols.Blank, '2', 1)
                ]
            ),
            new TransitionStatement(
                transitionNodes[1],
                transitionNodes[1],
                [
                    new HeadTransition('1', '2', -1),
                    new HeadTransition('1', '0', 0)
                ]
            ),
            new TransitionStatement(
                transitionNodes[1],
                transitionNodes[2],
                [
                    new HeadTransition('0', '3', 3),
                    new HeadTransition('0', '2', 1)
                ]
            )
        ],

        transitionNodes[0]
    );

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfigs[0])).toBe(0);
    expect(TuringMachineSimulator.AddTape(tapeConfigs[1])).toBe(1);
    expect(TuringMachineSimulator.AddMachine(machineConfig)).toBe(0);

    TuringMachineSimulator.StartSimulation();
    TuringMachineSimulator.Update();
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Machines[0].CurrentState).toBe(1);
    expect(currentSystemState.Tapes[0].Content).toBe("0101110");
    expect(currentSystemState.Tapes[1].Content).toBe("210");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].CurrentState).toBe(1);
    expect(currentSystemState.Tapes[0].Content).toBe("0201110");
    expect(currentSystemState.Tapes[1].Content).toBe("200");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].CurrentState).toBe(2);
    expect(currentSystemState.Tapes[0].Content).toBe("3201110");
    expect(currentSystemState.Tapes[1].Content).toBe("220");

    TuringMachineSimulator.Update();

    TuringMachineSimulator.Reset();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].CurrentState).toBe(0);
    expect(currentSystemState.Tapes[0].Content).toBe("1101110");
    expect(currentSystemState.Tapes[1].Content).toBe("_10");
    expect(TuringMachineSimulator.AddTape(tapeConfigs[1])).toBe(2);
})

test('Test case 5: Standard and meaningful simulation: reverser.', () => {
    const tapeConfigs = [
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            "abaaabb"
        ),
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            ""
        )
    ];
    
    let transitionNodes: TransitionNode[] = [];
    const reverserConfig = new TuringMachineConfig(
        2,
        [HeadTypes.ReadWrite, HeadTypes.ReadWrite],
        [-1, -1],
        [0, 1],
        transitionNodes = [
            new TransitionNode(0),
            new TransitionNode(1),
            new TransitionNode(2),
            new TransitionNode(3)
        ],
        [
            // State 0 transitions
            new TransitionStatement(
                transitionNodes[0],
                transitionNodes[0],
                [
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 1),
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0)
                ]
            ),
            new TransitionStatement(
                transitionNodes[0],
                transitionNodes[1],
                [
                    new HeadTransition('a', 'a', 1),
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0)
                ]
            ),
            new TransitionStatement(
                transitionNodes[1],
                transitionNodes[1],
                [
                    new HeadTransition('a', 'a', 1),
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0)
                ]
            ),
            new TransitionStatement(
                transitionNodes[1],
                transitionNodes[1],
                [
                    new HeadTransition('b', 'b', 1),
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0)
                ]
            ),
            new TransitionStatement(
                transitionNodes[1],
                transitionNodes[2],
                [
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, -1),
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0)
                ]
            ),
            new TransitionStatement(
                transitionNodes[2],
                transitionNodes[2],
                [
                    new HeadTransition('a', 'a', -1),
                    new HeadTransition(TapeSymbols.Blank, 'a', 1)
                ]
            ),
            new TransitionStatement(
                transitionNodes[2],
                transitionNodes[2],
                [
                    new HeadTransition('b', 'b', -1),
                    new HeadTransition(TapeSymbols.Blank, 'b', 1)
                ]
            ),
            new TransitionStatement(
                transitionNodes[2],
                transitionNodes[3],
                [
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0),
                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0)
                ]
            )
        ],
        transitionNodes[0]
    );

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfigs[0])).toBe(0);
    expect(TuringMachineSimulator.AddTape(tapeConfigs[1])).toBe(1);
    expect(TuringMachineSimulator.AddMachine(reverserConfig)).toBe(0);

    TuringMachineSimulator.StartSimulation();
    TuringMachineSimulator.SuperHot(20);
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Machines[0].CurrentState).toBe(3);
    expect(currentSystemState.Tapes[0].Content).toBe("_abaaabb_");
    expect(currentSystemState.Tapes[1].Content).toBe("bbaaaba_");
})

test('Test case 6: Mutiple writes fault.', () => {
    const tapeConfig = 
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            "12345678"
        );
    
    let transitionNodes: TransitionNode[] = [];
    const invalidMachineConfig = new TuringMachineConfig(
        2, // NumberOfHeads
        [HeadTypes.ReadWrite, HeadTypes.ReadWrite],
        [0, 2], // InitialPositions (head 0 at pos 0, head 1 at pos 2)
        [0, 0], // Both heads reference tape 0 (circular)
        transitionNodes = [
            new TransitionNode(0),
            new TransitionNode(1)
        ],
        [
            new TransitionStatement(
                transitionNodes[0],
                transitionNodes[1],
                [
                    new HeadTransition('1', '3', 1),  // Head 0: writes '3'
                    new HeadTransition('3', '1', -1) // Head 1: writes '1'
                    // Invalid: Both heads writing to same tape simultaneously
                ]
            ),
            new TransitionStatement(
                transitionNodes[1],
                transitionNodes[1],
                [
                    new HeadTransition('2', '2', 1),  // Head 0: no write
                    new HeadTransition('2', '9', -1) // Head 1: writes '9'
                ]
            )
        ],
        transitionNodes[0] // StartNode
    );

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfig)).toBe(0);
    expect(TuringMachineSimulator.AddMachine(invalidMachineConfig)).toBe(0);

    TuringMachineSimulator.StartSimulation();
    TuringMachineSimulator.Update();
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Machines[0].CurrentState).toBe(1);
    expect(currentSystemState.Tapes[0].Content).toBe("32145678");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Machines[0].IsHalted).toBe(true); // expecting multiple writes fault and machine to halt
})

test('Test case 7: Expecting single character write.', () => {
    const tapeConfig = 
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            "010001"
        );
    
    let transitionNodes: TransitionNode[] = [];
    const invalidMachineConfig = new TuringMachineConfig(
        2, // NumberOfHeads
        [HeadTypes.ReadWrite, HeadTypes.ReadWrite],
        [0, 2], // InitialPositions (head 0 at pos 0, head 1 at pos 2)
        [0, 0], // Both heads reference tape 0 (circular)
        transitionNodes = [
            new TransitionNode(0),
            new TransitionNode(1)
        ],
        [
            new TransitionStatement(
                transitionNodes[0],
                transitionNodes[1],
                [
                    new HeadTransition('1', '3', 1),  // Head 0: writes '3'
                    new HeadTransition('3', "1333", -1) // Head 1: writes '1333', not allowed.
                    // Invalid: Both heads writing to same tape simultaneously
                ]
            )
        ],
        transitionNodes[0] // StartNode
    );

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfig)).toBe(0);
    expect(() => TuringMachineSimulator.AddMachine(invalidMachineConfig))
        .toThrowError();
})


// More tests in the future for variants of tapes and heads