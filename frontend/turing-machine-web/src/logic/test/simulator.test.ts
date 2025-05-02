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
import { SignalState } from '../States/SignalStates';

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
    expect(currentSystemState.Tapes[0].LeftBoundary).toBe(-1);
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

test("Test case 8: Multiple machines with different variants of tape.", () => {
    const tapeConfigs = [
        new TapeConfig(
            TapeTypes.LeftLimited,
            10,
            "10101011"
        ),
        new TapeConfig(
            TapeTypes.Circular,
            4,
            "1011"
        )
    ];

    let transitionNodes: TransitionNode[] = [];
    const invalidMachineConfigs = [
        new TuringMachineConfig(
            2, // NumberOfHeads
            [HeadTypes.ReadWrite, HeadTypes.ReadWrite],
            [0, 2],
            [0, 1],
            transitionNodes = [
                new TransitionNode(0),
                new TransitionNode(1),
                new TransitionNode(2),
                new TransitionNode(3)
            ],
            [
                new TransitionStatement(
                    transitionNodes[0],
                    transitionNodes[1],
                    [
                        new HeadTransition('1', '2', 1),
                        new HeadTransition('1', "1", -3)
                    ]
                ),
                new TransitionStatement(
                    transitionNodes[1],
                    transitionNodes[2],
                    [
                        new HeadTransition('0', '1', 1),
                        new HeadTransition('1', "2", 1)
                    ]
                ),
                new TransitionStatement(
                    transitionNodes[2],
                    transitionNodes[3],
                    [
                        new HeadTransition('1', '1', 0),
                        new HeadTransition('1', "2", 1)
                    ]
                ),
                new TransitionStatement(
                    transitionNodes[3],
                    transitionNodes[3],
                    [
                        new HeadTransition('1', '1', -5), // This machine should halt now as it is out of range
                        new HeadTransition('0', "2", 1)
                    ]
                )
            ],
            transitionNodes[0] // StartNode
        ),
        new TuringMachineConfig(
            1, // NumberOfHeads
            [HeadTypes.ReadWrite],
            [7],
            [0],
            transitionNodes = [
                new TransitionNode(0),
                new TransitionNode(1),
            ],
            [
                new TransitionStatement(
                    transitionNodes[0],
                    transitionNodes[0],
                    [
                        new HeadTransition('1', '3', -1),
                    ]
                ),
                new TransitionStatement(
                    transitionNodes[0],
                    transitionNodes[1],
                    [
                        new HeadTransition('0', '5', 5),
                    ]
                )
            ],
            transitionNodes[0] // StartNode
        )
    ];

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfigs[0])).toBe(0);
    expect(TuringMachineSimulator.AddTape(tapeConfigs[1])).toBe(1);
    expect(TuringMachineSimulator.AddMachine(invalidMachineConfigs[0])).toBe(0);
    expect(TuringMachineSimulator.AddMachine(invalidMachineConfigs[1])).toBe(1);

    TuringMachineSimulator.StartSimulation();
    TuringMachineSimulator.Update();
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Machines[0].CurrentState).toBe(1);
    expect(currentSystemState.Tapes[0].Content).toBe(">20101013");
    expect(currentSystemState.Tapes[1].Content).toBe(">1011<");

    expect(currentSystemState.Tapes[0].LeftBoundary).toBe(0);
    expect(currentSystemState.Tapes[0].RightBoundary).toBe(7);
    expect(currentSystemState.Tapes[1].LeftBoundary).toBe(0);
    expect(currentSystemState.Tapes[1].RightBoundary).toBe(3);

    expect(currentSystemState.Machines[0].Heads[1].Position).toBe(3);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].CurrentState).toBe(2);
    expect(currentSystemState.Tapes[0].Content).toBe(">21101033");
    expect(currentSystemState.Tapes[1].Content).toBe(">1012<");
    expect(currentSystemState.Machines[1].Heads[0].Position).toBe(5);
    expect(currentSystemState.Machines[0].Heads[1].Position).toBe(0);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].CurrentState).toBe(3);
    expect(currentSystemState.Tapes[0].Content).toBe(">21101533___");
    expect(currentSystemState.Tapes[1].Content).toBe(">2012<");

    expect(currentSystemState.Tapes[0].LeftBoundary).toBe(0);
    expect(currentSystemState.Tapes[0].RightBoundary).toBe(10);
    expect(currentSystemState.Tapes[1].LeftBoundary).toBe(0);
    expect(currentSystemState.Tapes[1].RightBoundary).toBe(3);

    expect(currentSystemState.Machines[1].Heads[0].Position).toBe(10);
    expect(currentSystemState.Machines[0].Heads[1].Position).toBe(1);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Tapes[0].Content).toBe(">21101533___");
    expect(currentSystemState.Tapes[1].Content).toBe(">2212<");
    expect(currentSystemState.Machines[1].IsHalted).toBe(true);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].IsHalted).toBe(true);
})

test('Test case 9: Invalid limited tape config: tape initial content exceeds tape length.', () => {
    const tapeConfig = 
        new TapeConfig(
            TapeTypes.LeftRightLimited,
            5,
            "abbbbbcccc"
        );


    TuringMachineSimulator.Initialise();
    expect(() => TuringMachineSimulator.AddTape(tapeConfig)).toThrowError();        
})

test('Test case 10: Limited boundaries and out of range checking.', () => {
    const tapeConfig = 
        new TapeConfig(
            TapeTypes.LeftRightLimited,
            7,
            "___ab"
        );

    let transitionNodes: TransitionNode[] = [];
    const machineConfig = new TuringMachineConfig(
        1,  // number of heads
        [HeadTypes.ReadWrite],  // head types
        [3],    // initial positions
        [0],    // tape references
        transitionNodes = [new TransitionNode(0), new TransitionNode(1)],    // transition nodes
        [
            new TransitionStatement(
                transitionNodes[0], 
                transitionNodes[1], 
                [new HeadTransition('a', 'b', 1)]
            ),
            new TransitionStatement(
                transitionNodes[1], 
                transitionNodes[1], 
                [new HeadTransition('b', 'b', -8)]
            ),
        ], // transition statements
        transitionNodes[0] // start node
    )

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfig)).toBe(0); 
    expect(TuringMachineSimulator.AddMachine(machineConfig)).toBe(0); 

    TuringMachineSimulator.StartSimulation();
    TuringMachineSimulator.Update();
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Machines[0].CurrentState).toBe(1);
    expect(currentSystemState.Tapes[0].Content).toBe(">___bb__<");

    expect(currentSystemState.Tapes[0].LeftBoundary).toBe(0);
    expect(currentSystemState.Tapes[0].RightBoundary).toBe(6);

    expect(currentSystemState.Machines[0].Heads[0].Position).toBe(4);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Machines[0].CurrentState).toBe(1);
    expect(currentSystemState.Tapes[0].Content).toBe(">___bb__<");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].IsHalted).toBe(true);
})

test('Test case 11: Different variants of heads operate on variant of tape.', () => {
    const tapeConfig = 
        new TapeConfig(
            TapeTypes.Circular,
            8,
            "__babc"
        );

    let transitionNodes: TransitionNode[] = [];
    const machineConfig = new TuringMachineConfig(
        2,  // number of heads
        [HeadTypes.ReadOnly, HeadTypes.WriteOnly],  // head types
        [2, 5],    // initial positions
        [0, 0],    // tape references
        transitionNodes = [new TransitionNode(0), new TransitionNode(1), new TransitionNode(2)],    // transition nodes
        [
            new TransitionStatement(
                transitionNodes[0], 
                transitionNodes[1], 
                [
                    new HeadTransition('b', TapeSymbols.None, 1),
                    new HeadTransition(TapeSymbols.None, 'e', -2)
                ]
            ),
            new TransitionStatement(
                transitionNodes[1], 
                transitionNodes[2], 
                [
                    new HeadTransition('a', TapeSymbols.None, 1),
                    new HeadTransition(TapeSymbols.None, 'c', -1)
                ]
            ),
        ], // transition statements
        transitionNodes[0] // start node
    )

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfig)).toBe(0); 
    expect(TuringMachineSimulator.AddMachine(machineConfig)).toBe(0);

    TuringMachineSimulator.StartSimulation();
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Tapes[0].Content).toBe(">__babc__<");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Tapes[0].Content).toBe(">__babe__<");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Tapes[0].Content).toBe(">__bcbe__<");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].IsHalted).toBe(true);
})

test('Test case 12: Invalid statements for variants of heads.', () => {
    const tapeConfig = 
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            "love"
        );

        let transitionNodes: TransitionNode[] = [];
        const invalidMachineConfigs = [
            new TuringMachineConfig(
                1, // NumberOfHeads
                [HeadTypes.ReadOnly],
                [0],
                [0],
                transitionNodes = [new TransitionNode(0)],
                [
                    new TransitionStatement(
                        transitionNodes[0],
                        transitionNodes[0],
                        [new HeadTransition('l', 'g', 1)] // This is not allowed, read only head can't write
                    )
                ],
                transitionNodes[0] // StartNode
            ),
            new TuringMachineConfig(
                1, // NumberOfHeads
                [HeadTypes.WriteOnly],
                [0],
                [0],
                transitionNodes = [new TransitionNode(0), new TransitionNode(1)],
                [
                    new TransitionStatement(
                        transitionNodes[0],
                        transitionNodes[1],
                        [new HeadTransition(TapeSymbols.None, 'g', 1)]
                    ),
                    new TransitionStatement(
                        transitionNodes[1],
                        transitionNodes[1],
                        [new HeadTransition('o', 'l', 1)] // This is not allowed, write only head can't read
                    )
                ],
                transitionNodes[0] // StartNode
            ),
        ];

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfig)).toBe(0); 
    expect(TuringMachineSimulator.AddMachine(invalidMachineConfigs[0])).toBe(0);
    expect(TuringMachineSimulator.AddMachine(invalidMachineConfigs[1])).toBe(1);

    TuringMachineSimulator.StartSimulation();
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Tapes[0].Content).toBe("love");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Tapes[0].Content).toBe("gove");
    expect(currentSystemState.Machines[0].IsHalted).toBe(true);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].IsHalted).toBe(true);
    expect(currentSystemState.Machines[1].IsHalted).toBe(true);
})


test('Test case 13: Basic control signals.', () => {
    const tapeConfig = 
        new TapeConfig(
            TapeTypes.Infinite,
            -1,
            "000000"
        );

        let transitionNodes: TransitionNode[] = [];
        const machineConfigs = [
            new TuringMachineConfig(
                1, // NumberOfHeads
                [HeadTypes.WriteOnly],
                [2],
                [0],
                transitionNodes = [new TransitionNode(0)],
                [
                    new TransitionStatement(
                        transitionNodes[0],
                        transitionNodes[0],
                        [new HeadTransition(TapeSymbols.None, TapeSymbols.Pause, -1)]
                    ),
                ],
                transitionNodes[0] // StartNode
            ),
            new TuringMachineConfig(
                1, // NumberOfHeads
                [HeadTypes.WriteOnly],
                [4],
                [0],
                transitionNodes = [new TransitionNode(0)],
                [
                    new TransitionStatement(
                        transitionNodes[0],
                        transitionNodes[0],
                        [new HeadTransition(TapeSymbols.None, TapeSymbols.Running, -1)]
                    ),
                ],
                transitionNodes[0] // StartNode
            ),
            new TuringMachineConfig(
                1, // NumberOfHeads
                [HeadTypes.ReadOnly],
                [1],
                [0],
                transitionNodes = [new TransitionNode(0)],
                [
                    new TransitionStatement(
                        transitionNodes[0],
                        transitionNodes[0],
                        [new HeadTransition('0', TapeSymbols.None, 1)]
                    ),
                ],
                transitionNodes[0] // StartNode
            ),
        ];

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfig)).toBe(0); 
    expect(TuringMachineSimulator.AddMachine(machineConfigs[0])).toBe(0);
    expect(TuringMachineSimulator.AddMachine(machineConfigs[1])).toBe(1);
    expect(TuringMachineSimulator.AddMachine(machineConfigs[2])).toBe(2);

    TuringMachineSimulator.StartSimulation();
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Tapes[0].Content).toBe("000000");
    expect(currentSystemState.Tapes[0].TapeSignal).toBe("______");

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[2].Heads[0].Position).toBe(2);
    expect(currentSystemState.Tapes[0].TapeSignal).toBe("__2_1_");
    expect(currentSystemState.Machines[2].Signal).toBe(1);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[2].Heads[0].Position).toBe(2);
    expect(currentSystemState.Tapes[0].TapeSignal).toBe("_2_11_");
    expect(currentSystemState.Machines[2].Signal).toBe(2);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[1].Heads[0].Position).toBe(1);
    expect(currentSystemState.Machines[2].Heads[0].Position).toBe(2);
    expect(currentSystemState.Tapes[0].TapeSignal).toBe("_22111_");
    expect(currentSystemState.Machines[2].Signal).toBe(2);

    TuringMachineSimulator.Update();
    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[2].Heads[0].Position).toBe(3);
    expect(currentSystemState.Tapes[0].TapeSignal).toBe("_22__11_");
    expect(currentSystemState.Machines[1].Signal).toBe(2);
    expect(currentSystemState.Machines[2].Signal).toBe(1);
})

test('Test case 14: Empty initial tape content', () => {
    const tapeConfig0 = new TapeConfig(
        TapeTypes.Infinite,
        -1, // tape length, infinite tape will ignore
        "aa" // tape content
    )

    const tapeConfig1 = new TapeConfig(
        TapeTypes.Infinite,
        -1, // tape length, infinite tape will ignore
        "" // tape content
    )

    let transitionNodes = [];
    const machineConfig = new TuringMachineConfig(
        2,  // number of heads
        [HeadTypes.ReadWrite, HeadTypes.ReadWrite],  // head types
        [0, 0],    // initial positions
        [0, 1],    // tape references
        transitionNodes = [new TransitionNode(0)],    // transition nodes
        [new TransitionStatement(
            transitionNodes[0], 
            transitionNodes[0], 
            [
                new HeadTransition('a', 'a', 1),
                new HeadTransition(TapeSymbols.Blank, 'a', -1)
            ]
        )], // transition statements
        transitionNodes[0] // start node
    )

    TuringMachineSimulator.Initialise();
    expect(TuringMachineSimulator.AddTape(tapeConfig0)).toBe(0); 
    expect(TuringMachineSimulator.AddTape(tapeConfig1)).toBe(1); 
    expect(TuringMachineSimulator.AddMachine(machineConfig)).toBe(0);

    TuringMachineSimulator.StartSimulation();
    let currentSystemState = TuringMachineSimulator.GetSystemState();

    expect(currentSystemState.Tapes[0].Content).toBe("aa");
    expect(currentSystemState.Tapes[1].Content).toBe("_");

    TuringMachineSimulator.Update();
    TuringMachineSimulator.Update();

    currentSystemState = TuringMachineSimulator.GetSystemState();
    expect(currentSystemState.Machines[0].Heads[0].Position).toBe(2);
    expect(currentSystemState.Machines[0].Heads[1].Position).toBe(-2);

    expect(currentSystemState.Tapes[1].LeftBoundary).toBe(-2);
    expect(currentSystemState.Tapes[1].RightBoundary).toBe(0);
    expect(currentSystemState.Tapes[0].Content).toBe("aa_");
    expect(currentSystemState.Tapes[1].Content).toBe("_aa");
})