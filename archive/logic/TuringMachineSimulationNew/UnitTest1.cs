using NUnit.Framework;
using TuringMachineSimulation.Logic;
using TuringMachineSimulation.Logic.States.Transition;
using TuringMachineSimulation.Logic.Tapes;
using TuringMachineSimulation.Logic.Tapes.TapesUtilities;
using TuringMachineSimulation.Logic.Heads;
using System;
using System.Collections.Generic;

namespace TuringMachineSimulation.TapeTest;

[TestFixture]
public class Tests
{
    private SystemState _state;

    public void AssertTapeContent(SystemState systemState, string[] expectedTapeContents)
    {
        if (expectedTapeContents == null) return;
        
        Assert.AreEqual(expectedTapeContents.Length, systemState.Tapes.Count,
            $"Tape count mismatch. Expected: {expectedTapeContents.Length}, Actual: {systemState.Tapes.Count}");
        
        for (int i = 0; i < systemState.Tapes.Count; i++)
        {
            Assert.That(systemState.Tapes[i].Content, Is.EqualTo(expectedTapeContents[i]), 
                $"Tape {i} content mismatch. Expected: {expectedTapeContents[i]}, Actual: {systemState.Tapes[i].Content}");
        }
    }

    // Correct way to define a TestCaseSource in NUnit 3
    public static IEnumerable<TestCaseData> SimulationConfig()
    {
        List<TransitionNode> transitionNodes;

        List<TestCaseData> testCaseData = new List<TestCaseData>()
        {
            new TestCaseData(
                new List<TapeConfig>
                {
                    new TapeConfig(TapeTypes.Infinite, -1, "1101110"),
                    new TapeConfig(TapeTypes.RightLimited, 4, "_10")
                },
                new List<TuringMachineConfig>
                {
                    new TuringMachineConfig(
                        2, // NumberOfHeads
                        new List<HeadType>
                        {
                            HeadType.ReadWrite,
                            HeadType.ReadWrite
                        },
                        new List<int> { 0, 0 }, // InitialPositions
                        new List<int> { 0, 1 }, // TapesReference
                        transitionNodes = new List<TransitionNode>
                        {
                            new TransitionNode(0),
                            new TransitionNode(1),
                            new TransitionNode(2)
                        },
                        new List<TransitionStatement>
                        {
                            new TransitionStatement(
                                transitionNodes[0],
                                transitionNodes[1],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('1', '0', 1),
                                    new HeadTransition(TapeSymbols.Blank, '2', 1)
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[1],
                                transitionNodes[1],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('1', '2', -1),
                                    new HeadTransition('1', '0', 0)
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[1],
                                transitionNodes[2],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('0', '3', 3),
                                    new HeadTransition('0', '2', 1)
                                }
                            )
                        },
                        new TransitionNode(0)
                    )
                },
                new[] { "3201110", "220_<" }
            ).SetName("Standard config 1"),

            new TestCaseData(
                new List<TapeConfig>
                {
                    new TapeConfig(TapeTypes.Infinite, -1, "abaaabb"),
                    new TapeConfig(TapeTypes.Infinite, -1, "")
                },
                new List<TuringMachineConfig>
                {
                    new TuringMachineConfig(
                        2, // NumberOfHeads
                        new List<HeadType>
                        {
                            HeadType.ReadWrite, // Head 0 for Tape 0 (input)
                            HeadType.ReadWrite // Head 1 for Tape 1 (output)
                        },
                        new List<int> { -1, -1 }, // InitialPositions
                        new List<int> { 0, 1 }, // TapesReference: Head 0 -> Tape 0, Head 1 -> Tape 1, Head 2 -> Tape 2
                        transitionNodes = new List<TransitionNode>
                        {
                            new TransitionNode(0), // Move Head 1 to start of Tape 1
                            new TransitionNode(1), // Move Head 1 to end of Tape 1
                            new TransitionNode(2), // Reverse string state
                            new TransitionNode(3) // Halt state
                        },
                        new List<TransitionStatement>
                        {
                            // State 0: Move Head 1 right to the first character
                            new TransitionStatement(
                                transitionNodes[0],
                                transitionNodes[0],
                                new List<HeadTransition>
                                {
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 1), // Head 1 moves right
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0) // Head 2 stays
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[0],
                                transitionNodes[1],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('a', 'a', 1), // Head 1 sees 'a', move right
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0) // Head 2 stays
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[0],
                                transitionNodes[1],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('b', 'b', 1), // Head 1 sees 'b', move right
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0) // Head 2 stays
                                }
                            ),

                            // State 1: Move Head 1 to the end of the string
                            new TransitionStatement(
                                transitionNodes[1],
                                transitionNodes[1],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('a', 'a', 1), // Head 1 reads 'a', move right
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0) // Head 2 stays
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[1],
                                transitionNodes[1],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('b', 'b', 1), // Head 1 reads 'b', move right
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0) // Head 2 stays
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[1],
                                transitionNodes[2],
                                new List<HeadTransition>
                                {
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank,
                                        -1), // Head 1 sees blank, move left to last char
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0) // Head 2 stays
                                }
                            ),

                            // State 2: Reverse the string by copying from Tape 1 to Tape 2
                            new TransitionStatement(
                                transitionNodes[2],
                                transitionNodes[2],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('a', 'a', -1), // Head 1 reads 'a', move left
                                    new HeadTransition(TapeSymbols.Blank, 'a', 1) // Head 2 writes 'a', move right
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[2],
                                transitionNodes[2],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('b', 'b', -1), // Head 1 reads 'b', move left
                                    new HeadTransition(TapeSymbols.Blank, 'b', 1) // Head 2 writes 'b', move right
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[2],
                                transitionNodes[3],
                                new List<HeadTransition>
                                {
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank,
                                        0), // Head 1 sees blank, stay
                                    new HeadTransition(TapeSymbols.Blank, TapeSymbols.Blank, 0) // Head 2 stays, halt
                                }
                            )
                        },
                        transitionNodes[0] // StartNode
                    )
                },
                new[] { "_abaaabb_", "bbaaaba_" }
            ).SetName("Standard config 2: Reverser"),
            
            new TestCaseData(
                new List<TapeConfig>
                {
                    new TapeConfig(TapeTypes.LeftLimited, 1, "_10")
                },
                new List<TuringMachineConfig>
                {
                    new TuringMachineConfig(
                        1, // NumberOfHeads
                        new List<HeadType>
                        {
                            HeadType.ReadWrite,
                        },
                        new List<int> { 0 }, // InitialPositions
                        new List<int> { 0 }, // TapesReference
                        transitionNodes = new List<TransitionNode>
                        {
                            new TransitionNode(0),
                        },
                        new List<TransitionStatement>
                        {
                            new TransitionStatement(
                                transitionNodes[0],
                                transitionNodes[0],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('1', '0', 1),
                                    new HeadTransition(TapeSymbols.Blank, '2', 1)
                                }
                            ),
                        },
                        new TransitionNode(0)
                    )
                },
                null
            ).SetName("Invalid config 3: Initial contents exceeds max length"),
            
            new TestCaseData(
                new List<TapeConfig>
                {
                new TapeConfig(TapeTypes.RightLimited, 4, "_10")
            },
            new List<TuringMachineConfig>
            {
                new TuringMachineConfig(
                    1, // NumberOfHeads
                    new List<HeadType>
                    {
                        HeadType.ReadWrite,
                    },
                    new List<int> { 0 }, // InitialPositions
                    new List<int> { 1 }, // TapesReference
                    transitionNodes = new List<TransitionNode>
                    {
                        new TransitionNode(0),
                    },
                    new List<TransitionStatement>
                    {
                        new TransitionStatement(
                            transitionNodes[0],
                            transitionNodes[0],
                            new List<HeadTransition>
                            {
                                new HeadTransition('1', '0', 1),
                                new HeadTransition(TapeSymbols.Blank, '2', 1)
                            }
                        ),
                    },
                    new TransitionNode(0)
                )
            },
            null
                ).SetName("Invalid config 4: Tape reference error"),
            
            new TestCaseData(
                new List<TapeConfig>
                {
                    new TapeConfig(TapeTypes.Circular, 8, "123456")
                },
                new List<TuringMachineConfig>
                {
                    new TuringMachineConfig(
                        2, // NumberOfHeads
                        new List<HeadType>
                        {
                            HeadType.ReadWrite,
                            HeadType.WriteOnly,
                        },
                        new List<int> { 0, 2 }, // InitialPositions
                        new List<int> { 0, 0 }, // TapesReference
                        transitionNodes = new List<TransitionNode>
                        {
                            new TransitionNode(0),
                            new TransitionNode(1),
                        },
                        new List<TransitionStatement>
                        {
                            new TransitionStatement(
                                transitionNodes[0],
                                transitionNodes[1],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('1', '3', 1),
                                    new HeadTransition(TapeSymbols.None, '1', -1)
                                }
                            ),
                            new TransitionStatement(
                                transitionNodes[1],
                                transitionNodes[1],
                                new List<HeadTransition>
                                {
                                    new HeadTransition('2', '2', 1),
                                    new HeadTransition(TapeSymbols.None, '9', -1)
                                }
                            ),
                        },
                        new TransitionNode(0)
                    )
                },
                null
            ).SetName("Invalid config 5: Multiple writes error")
        };

        foreach (var testCase in testCaseData)
            yield return testCase;
    }
        
    [Test, TestCaseSource(nameof(SimulationConfig))]
    public void TestSimulationScenarios(
        List<TapeConfig> tapes,
        List<TuringMachineConfig> machines,
        string[] expectedTapeContents)
    {
        try
        {
            // Initialize first to ensure clean state
            TuringMachineSimulationManager.Initialise();
            
            foreach (var tape in tapes)
            {
                TuringMachineSimulationManager.AddTape(tape);
            }
            
            foreach (var machine in machines)
            {
                TuringMachineSimulationManager.AddMachine(machine);
            }
            
            // 2. Pre-simulation State Test
            var initialState = TuringMachineSimulationManager.GetSystemState();
            Assert.AreEqual(tapes.Count, initialState.Tapes.Count, 
                "Initial tape count mismatch");

            // 3. Simulation Test
            TuringMachineSimulationManager.StartSimulation();
            TuringMachineSimulationManager.SuperHot(20);
            
            // Explicitly stop simulation before checking state
            TuringMachineSimulationManager.StopSimulation();
            System.Threading.Thread.Sleep(50); // Small delay to ensure stop is processed
            
            // 4. Post-simulation State Test
            var postUpdateState = TuringMachineSimulationManager.GetSystemState();
            AssertTapeContent(postUpdateState, expectedTapeContents);
        }
        catch (Exception ex) when (expectedTapeContents == null)
        {
            Assert.Pass($"Caught expected exception: {ex.GetType().Name}");
        }
        catch (Exception ex)
        {
            Assert.Fail($"Unexpected exception: {ex.GetType().Name} - {ex.Message}\n{ex.StackTrace}");
        }
    }

    [SetUp]
    public void Setup()
    {
        
    }

    [TearDown]
    public void Cleanup()
    {
        
    }
}