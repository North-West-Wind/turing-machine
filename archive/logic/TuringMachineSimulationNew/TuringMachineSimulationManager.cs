using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TuringMachineSimulation.Logic.Heads;
using TuringMachineSimulation.Logic.Tapes;
using TuringMachineSimulation.Logic.Tapes.TapesUtilities;
using TuringMachineSimulation.Logic.States.Transition;

namespace TuringMachineSimulation.Logic
{
    public static class TuringMachineSimulationManager
    {
        private static List<TuringMachine> _machines = new List<TuringMachine>();
        private static List<ITape> _tapes = new List<ITape>();
        
        // IDs are not reusable, unless the system is reinitialized
        private static int _nextTapeID = 0;
        private static int _nextMachineID = 0;
        
        private static bool _isRunning = false;
        private static List<TransitionNode> _runningNodes = new List<TransitionNode>();
        
        // Store the original configurations for resetting the system
        private static List<TuringMachineConfig> _originalMachineConfigs = new List<TuringMachineConfig>();
        private static List<TapeConfig> _originalTapeConfigs = new List<TapeConfig>();
        
        private static SystemState _systemState = new SystemState(); 
        
        #region Append managed machines
        /// <summary>
        /// Adds a new tape to the system for simulating.
        /// </summary>
        /// <param name="config"></param>
        /// <returns></returns>
        /// <exception cref="InvalidOperationException">Throw when inserting new tape during simulating. </exception>
        public static int AddTape(TapeConfig config)
        {
            if (_isRunning)
                throw new InvalidOperationException("Cannot insert new tape while simulating.");

            int newTapeID = _nextTapeID;
            ITape tape = TuringMachineFactory.MakeTape(config);
            _tapes.Add(tape);
            _originalTapeConfigs.Add(config); // Store original config
            _nextTapeID++;
            
            Console.WriteLine($"Added a new tape with ID {newTapeID}");
            return newTapeID;
        }
        
        /// <summary>
        /// Deletes an existing tape using tape IDs given by <see cref="AddTapes"/> function.
        /// </summary>
        /// <param name="tapeID"> The ID of the tape to delete. </param>
        /// <exception cref="ArgumentOutOfRangeException"> Throws when the tape ID is invalid or the tape does not exist. </exception>
        /// <exception cref="InvalidOperationException"> Throws when attempting to delete a tape during simulation or if the tape is in use. </exception>
        public static void DeleteTape(int tapeID)
        {
            // Throw this when deleting a tape during simulation.
            if (_isRunning)
            {
                throw new InvalidOperationException(
                    "Cannot delete a tape while the simulation is running. Stop the simulation first.");
            }

            // Throw this when the tape ID is out of range or the tape does not exist.
            if (tapeID < 0 || tapeID >= _tapes.Count || _tapes[tapeID] == null)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(tapeID), 
                    $"Tape with ID {tapeID} does not exist or is already deleted.");
            }

            // Check if the tape is being used by any machine
            for (int machineIndex = 0; machineIndex < _machines.Count; machineIndex++)
            {
                var machine = _machines[machineIndex];
                if (machine == null) continue;

                foreach (var head in machine.Heads)
                {
                    if (head.IsUsesTape(_tapes[tapeID]))
                    {
                        throw new InvalidOperationException(
                            $"Tape with ID {tapeID} is in use by machine {machineIndex}. Remove the machine first.");
                    }
                }
            }

            // Delete the tape by setting its slot to null
            _tapes[tapeID] = null;
            _originalTapeConfigs[tapeID] = null;
            
            Console.WriteLine($"Tape with ID {tapeID} has been successfully deleted.");
        }
        
        /// <summary>
        /// Adds a new Turing Machine for simulating.
        /// </summary>
        /// <exception cref="InvalidOperationException"> Throw when inserting new Turing Machine during simulating. </exception>
        /// <returns> The unique ID for the newly inserted Turing Machine. </returns>
        public static int AddMachine(TuringMachineConfig config)
        {
            // Throw this when new Turing Machine were inserted during simulating.
            if (_isRunning)
                throw new InvalidOperationException(
                    "Cannot insert new machine while simulating. Please reset the machine before adding new ones.");
            
            // Instantiate an empty machine and return its ID
            int newMachineID = _nextMachineID;
            
            // Convert the tape reference to ITape objects
            List<ITape> useTapes = config.TapesReference.Select(tapeID => _tapes[tapeID]).ToList();
            
            // Set start state
            _runningNodes.Add(config.StartNode); // Initialize running state too
            
            TuringMachine machine = TuringMachineFactory.MakeTuringMachine(config, useTapes);
            _machines.Add(machine);
            _originalMachineConfigs.Add(config); // Store original config
            _nextMachineID++;
            
            Console.WriteLine($"Added a new machine with ID {newMachineID}");
            return newMachineID;
        }

        /// <summary>
        /// Deletes an existing Turing Machine using machine IDs given by <see cref="AddMachine"/> function
        /// Removed machine's ID will not be reused.
        /// </summary>
        /// <param name="machineID"></param>
        /// <exception cref="ArgumentOutOfRangeException"> Throw when deleting a non-exist Turing Machine. </exception>
        /// <exception cref="InvalidOperationException"> Throw when deleting a Turing Machine during simulating. </exception>
        public static void DeleteMachine(int machineID)
        {
            // Throw this when deleting Turing Machine were inserted during simulating.
            if (_isRunning)
                throw new InvalidOperationException(
                    "Cannot delete a machine while the simulation is running. Stop the simulation first.");

            // Throw this when deleting a non-exist Turing Machine.
            if (_machines[machineID] == null || machineID < 0)
                throw new ArgumentOutOfRangeException(
                    $"Machine with ID {machineID} does not exist or is already deleted.");
            
            // Delete the machine using RemoveAt()
            _machines[machineID] = null;
            _runningNodes[machineID] = null;
            _originalMachineConfigs[machineID] = null;
            
            Console.WriteLine($"Machine with ID {machineID} has been successfully deleted.");
        }

        public static void RemoveHaltedMachine()
        {
            for (int i = _machines.Count - 1; i >= 0; i--)
            {
                if (_machines[i].IsHalted)
                {
                    _machines.RemoveAt(i);
                    _runningNodes.RemoveAt(i);
                }
            }
        }
        #endregion


        #region Manipulating simulation
        /// <summary>
        /// Resets the simulation to its original state.
        /// </summary>
        /// <exception cref="InvalidOperationException">Thrown when resetting during simulation.</exception>
        public static void Reset()
        {
            if (_isRunning)
                throw new InvalidOperationException("Cannot reset while running.");

            _machines.Clear();
            _tapes.Clear();
            _runningNodes.Clear();

            // Restore from original configs keeping IDs
            for (int i = 0; i < _originalTapeConfigs.Count; i++)
            {
                if (_originalTapeConfigs[i] != null)
                    _tapes.Add(TuringMachineFactory.MakeTape(_originalTapeConfigs[i]));
                else
                    _tapes.Add(null);
            }

            // Restore machines from original configs, keeping IDs
            for (int i = 0; i < _originalMachineConfigs.Count; i++)
            {
                if (_originalMachineConfigs[i] != null)
                {
                    var config = _originalMachineConfigs[i];
                    List<ITape> useTapes = config.TapesReference.Select(tapeID => _tapes[tapeID]).ToList();
                    TuringMachine machine = TuringMachineFactory.MakeTuringMachine(config, useTapes);
                    _machines.Add(machine);
                    _runningNodes.Add(config.StartNode); // Make sure this node is the same one referenced in the machine's graph
                }
                else
                {
                    _machines.Add(null);
                    _runningNodes.Add(null);
                }
            }
            
            Console.WriteLine("Reset successfully!");
        }

        /// <summary>
        /// Initialises the simulation environment.
        /// </summary>
        public static void Initialise()
        {
            // Clear existing machines and tapes
            _machines.Clear();
            _tapes.Clear();
            _originalMachineConfigs.Clear();
            _originalTapeConfigs.Clear();

            // Reset counters
            _nextTapeID = 0;
            _nextMachineID = 0;

            // Reset simulation state
            _isRunning = false;
            _runningNodes.Clear();
            
            Console.WriteLine("Initialized successfully! Add your tapes and machines to start!");
        }

        /// <summary>
        /// Start the simulation. After invoking this method, no more add or delete is allowed.
        /// </summary>
        public static void StartSimulation()
        {
            _isRunning = true;
            Console.WriteLine("Simulation started.");
        }
        
        /// <summary>
        /// Stop the simulation.
        /// </summary>
        public static void StopSimulation()
        {
            _isRunning = false;
            Console.WriteLine("Simulation stopped manually.");
        }

        /// <summary>
        /// Simulates one step for each machine.
        /// </summary>
        /// <exception cref="NotImplementedException"></exception>
        public static void Update()
        {
            if (!_isRunning) return;
            
            bool hasUpdated = false;
            
            // For each tape, let position maps to a list of head ID, for visualization only
            List<Dictionary<int, List<Tuple<int, int>>>> headPositionsForTapes = new List<Dictionary<int, List<Tuple<int, int>>>>();
            for (int i = 0; i < _tapes.Count; i++)
            {
                headPositionsForTapes.Add(new Dictionary<int, List<Tuple<int, int>>>());
            }

            for (int machineIndex = 0; machineIndex < _machines.Count; machineIndex++)
            {
                var machine = _machines[machineIndex];

                if (machine == null || machine.IsHalted)
                    continue;
                
                // Step 1: Heads read the content from their operating tapes
                string readContents = "";
                foreach (var head in machine.Heads)
                {
                    readContents += head.GetCurrentContent();
                }
                
                // Step 2: Create a key to look up the transition
                TransitionKey key = new TransitionKey(_runningNodes[machineIndex], readContents);

                if (!machine.Graph.TryGetTransitionValue(key, out TransitionValue value))
                {
                    Console.WriteLine($"Machine {machineIndex} has no transition value and hence halts.");
                    machine.IsHalted = true;
                    continue;
                }

                _runningNodes[machineIndex] = value.Destination;
                string writeContents = value.HeadsWrites;
                List<int> headMoves = (List<int>)value.HeadsMoves;
                
                // Step 3: Write contents and moves
                int headWriteMovesIndex = 0;
                foreach (var head in machine.Heads)
                {
                    if (!head.TryWrite(writeContents[headWriteMovesIndex],
                            machineIndex, headWriteMovesIndex))
                    {
                        Console.WriteLine($"Multiple/Invalid write operations failed. Machine {machineIndex} halts.");
                        machine.IsHalted = true;
                        break;
                    }

                    head.Move(headMoves[headWriteMovesIndex]);
                    
                    // Ensure the dictionary for this tape exists
                    if (!headPositionsForTapes[head.TapeID].ContainsKey(head.Position))
                    {
                        headPositionsForTapes[head.TapeID][head.Position] = new List<Tuple<int, int>>();
                    }
                    
                    // Add the head ID to the list for this position
                    headPositionsForTapes[head.TapeID][head.Position]
                        .Add(new Tuple<int, int>(machineIndex, headWriteMovesIndex));

                    _tapes[head.TapeID].UpdateBoundaries(head.Position);
                    
                    headWriteMovesIndex++;
                }
                hasUpdated = true;
            }
            
            if (hasUpdated)
            {
                // Update the tape contents
                foreach (var tape in _tapes)
                {
                    if (tape != null)
                        tape.CommitWrite();
                }
            
                // Display the tape contents
                int tapeID = 0;
                foreach (var tape in _tapes)
                {
                    if (tape != null)
                        tape.DisplayContent(headPositionsForTapes[tapeID], tapeID);
                    
                    tapeID++;
                }

                for (int machineIndex = 0; machineIndex < _machines.Count; machineIndex++)
                {
                    if (_machines[machineIndex] == null)
                        continue;
                    Console.WriteLine($"Machine {machineIndex} state: {_runningNodes[machineIndex].StateID}");
                }
            }
            else
            {
                _isRunning = false;
                Console.WriteLine("Simulation finished. Please reset the system before continuing.");
            }
            
            Console.WriteLine("----------------------------------------");
        }

        /// <summary>
        /// Update the system state. When UI trys to get the system state, this will be automatically called.
        /// </summary>
        private static void UpdateSystemState()
        {
            var state = new SystemState();
            
            // Step 1. Handle tapes with boundaries and symbols
            if (_tapes == null)
            {
                Console.WriteLine("Warning: _tapes is null in UpdateSystemState");
                return;
            }

            for (int tapeIndex = 0; tapeIndex < _tapes.Count; tapeIndex++)
            {
                if (_tapes[tapeIndex] == null)
                    continue;
                
                var tape = _tapes[tapeIndex];
                state.Tapes.Add(new TapeState
                {
                    ID = tapeIndex,
                    Content = tape?.GetContentsAsString() ?? "(null)",
                    LeftBoundary = tape.LeftBoundary,
                    RightBoundary = tape.RightBoundary
                });
            }

            // Step 2. Handle machines with explicit head-tape relationships
            if (_machines == null)
            {
                Console.WriteLine("Warning: _machines is null in UpdateSystemState");
                return;
            }

            for (int machineIndex = 0; machineIndex < _machines.Count; machineIndex++)
            {
                var machine = _machines[machineIndex];
                
                if (machine == null)
                {
                    state.Machines.Add(null);
                    continue;
                }

                var machineState = new MachineState
                {
                    ID = machineIndex,
                    CurrentState = _runningNodes[machineIndex].StateID,
                    IsHalted = machine.IsHalted
                };

                // Step 3. Handle heads with explicit tape references
                if (machine.Heads == null)
                {
                    Console.WriteLine($"Warning: Machine {machineIndex} has null Heads");
                }
                else
                {
                    foreach (var head in machine.Heads)
                    {
                        if (head == null)
                        {
                            Console.WriteLine($"Warning: Machine {machineIndex} has null Head");
                            continue;
                        }

                        machineState.Heads.Add(new HeadState
                        {
                            TapeID = head.TapeID,
                            Position = head.Position
                        });
                    }
                }

                state.Machines.Add(machineState);
            }

            _systemState = state;
        }
        
        /// <summary>
        /// For UI for obtain the system state.
        /// </summary>
        /// <returns> A system state object. </returns>
        public static SystemState GetSystemState()
        {
            UpdateSystemState();
            return _systemState;
        }
        
        /// <summary>
        /// Simulates the Turing Machines as quickly as possible. <br/>
        /// Notes: Ignores MSPT during simulation.
        /// </summary>
        /// <param name="ticks"> How many ticks (steps) to super-hot with </param>
        public static void SuperHot(int ticks)
        {
            // Run the specified number of ticks
            for (int i = 0; i < ticks; i++)
            {
                Update();
            }
        }
        #endregion
    }
}