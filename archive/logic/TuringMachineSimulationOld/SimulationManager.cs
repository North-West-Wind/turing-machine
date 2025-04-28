using System.Diagnostics;
using ECS.TuringMachineLib.Tape;
using ECS.TuringMachineLib.Head;

namespace ECS.TuringMachineLib;

public static class SimulationManager
{
    private static TuringMachine Machine { get; set; }
    private static Timer _timer;
    private static int State = 0;
    private static readonly int _tickInterval = 1000;
    private static int _tickCount;
    private static bool _running;
    
    public static void Initialize(int numOfStates, int[] finalStates, int numOfTapes, int numOfHeads, int[] tapeMode, int[] headMode,
        Transition[] transitions)
    {
        TuringMachineFactory factory = new TuringMachineFactory();
        Machine = factory.CreateTuringMachine(numOfStates, finalStates, numOfTapes, numOfHeads, tapeMode, headMode, transitions);
    }

    private static void Reset()
    {
        Machine.IsHalted = false;
    }
    
    private static void ProcessStep()
    {
        // Step 1: Read symbols from all heads
        char[] readSymbols = new char[Machine.Heads.Length];
        for (int i = 0; i < Machine.Heads.Length; i++)
        {
            readSymbols[i] = Machine.Heads[i].TryRead();
        }

        // Step 2: Create a key from the read symbols (e.g., "ab" for two tapes)
        string readKey = new string(readSymbols);

        // Step 3: Look up the transition in the TransitionGraph
        if (!Machine.TransitionGraph[State].TryGetValue(readKey, out var transition))
        {
            // No valid transition found; halt the machine
            Machine.IsHalted = true;
            StopSimulation();
            return;
        }

        // Extract transition components
        var (toWrite, nextState, moveDirections) = transition;

        // Step 4: Write symbols and move heads
        for (int i = 0; i < Machine.Heads.Length; i++)
        {
            if (!Machine.Heads[i].TryWrite(toWrite[i]))
            {
                // Writing failed; halt the machine
                Machine.IsHalted = true;
                StopSimulation();
                return;
            }

            // Move the head based on the direction
            if (moveDirections[i])
                Machine.Heads[i].MoveRight();
            else
                Machine.Heads[i].MoveLeft();
        }

        // Step 5: Update the machine state
        State = nextState;

        for (int i = 0; i < Machine.Tapes.Length; i++)
        {
            Machine.Tapes[i].CommitWrites();
            Console.Write($"Tape {i}: "); // Correct string interpolation
            Machine.Tapes[i].DisplayContent(10, Machine.Heads[i].GetHeadCell(), State);
        }
    }
    
    private static void Tick(object state)
    {
        if (!_running || Machine.IsHalted) return;
        
        try 
        {
            ProcessStep();
            Debug.WriteLine($"Processed step at {DateTime.Now:HH:mm:ss}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Simulation error: {ex.Message}");
            StopSimulation();
        }
    }
    
    public static void StartSimulation(string input)
    {
        _running = true;
        _tickCount = 0;

        Reset();
        Machine.Tapes[(int)TapeFunction.Input].InitializeInput(input);
        
        Console.WriteLine($"The initial contents of the tape are:");
        for (int i = 0; i < Machine.Tapes.Length; i++)
        {
            Machine.Tapes[i].DisplayContent(10, Machine.Heads[i].GetHeadCell(), State);
        }
        
        // Call Tick() functions with a specific time interval
        _timer = new Timer(Tick, null, _tickInterval, _tickInterval);
        Console.WriteLine("Simulation started!");
    }

    public static void StopSimulation()
    {
        _running = false;
        _timer?.Dispose();
        if (Machine.State[State] == TuringMachineState.Accept)
            Console.WriteLine("Input accepted!");
        else
            Console.WriteLine("Input rejected!");
        
        Debug.WriteLine("Simulation stopped");
    }
}