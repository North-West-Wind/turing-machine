using ECS.TuringMachineLib.Tape;
using ECS.TuringMachineLib.Head;

namespace ECS.TuringMachineLib;

public class TuringMachineFactory
{
    private void AssignStates(TuringMachine machine, int numOfStates, int[] finalStates)
    {
        machine.State = new TuringMachineState[numOfStates];
        
        for (int i = 0; i < numOfStates; i++)
        {
            machine.State[i] = new TuringMachineState();
            machine.State[i] = TuringMachineState.Reject;
        }

        machine.State[0] = TuringMachineState.Start;

        foreach (var state in finalStates)
        {
            machine.State[state] = TuringMachineState.Accept;
        }
    }
    
    private void AddTransition(TuringMachine machine, Transition[] transitions)
    {
        machine.TransitionGraph = new Dictionary<string, (char[], int, bool[])>[machine.State.Length];
        
        for (int i = 0; i < machine.TransitionGraph.Length; i++)
        {
            // Initialize each dictionary in the array
            machine.TransitionGraph[i] = new Dictionary<string, (char[], int, bool[])>();
        }
        
        foreach (var trans in transitions)
        {
            string readKey = new string(trans.ReadSymbol);
            machine.TransitionGraph[trans.SrcID][readKey] = 
                (trans.WriteSymbol, trans.DstID, trans.IsMoveRight);
        }
    }
    
    private void InitializeTapesAndHeads(TuringMachine machine, int numOfTapes, int numOfHeads, int[] tapeMode, int[] headMode)
    {
        machine.Tapes = new ITape[numOfTapes];
        machine.Heads = new IHead[numOfHeads];

        for (int i = 0; i < numOfTapes; i++)
        {
            machine.Tapes[i] = new InfiniteTape();
        }

        for (int i = 0; i < numOfHeads; i++)
        {
            machine.Heads[i] = new ReadWriteHead(i, machine.Tapes[i]);
        }
    }
    
    public TuringMachine CreateTuringMachine(int numOfStates, int[] finalStates, int numOfTapes, int numOfHeads, int[] tapeMode, int[] headMode,
        Transition[] transitions)
    {
        TuringMachine machine = new TuringMachine
        {
            PauseInput = Signal.Other,
            IsHalted = false
        };
        
        AssignStates(machine, numOfStates, finalStates);
        InitializeTapesAndHeads(machine, numOfTapes, numOfHeads, tapeMode, headMode);
        AddTransition(machine, transitions);

        return machine;
    }
}