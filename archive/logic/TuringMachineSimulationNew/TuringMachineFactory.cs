using TuringMachineSimulation.Logic.States.Transition;
using TuringMachineSimulation.Logic.Tapes;
using TuringMachineSimulation.Logic.Heads;
using TuringMachineSimulation.Logic.States;
using TuringMachineSimulation.Logic.Tapes.TapesUtilities;

namespace TuringMachineSimulation.Logic;

public static class TuringMachineFactory
{
    /// <summary>
    /// Method for simulator to make ITape objects.
    /// </summary>
    /// <param name="config"> The configuration of the tape. </param>
    /// <exception cref="ArgumentException"> Throw when the tape type is invalid. </exception>
    public static ITape MakeTape(TapeConfig config)
    {
        ITape tape;
        switch (config.TapeType)
        {
            case TapeTypes.Infinite:
                tape = new InfiniteTape(0, config.TapeContent.Length - 1);
                break;
            case TapeTypes.Circular:
                tape = new CircularTape(0, config.TapeLength - 1);
                break;
            case TapeTypes.LeftLimited:
                tape = new LimitedTape(true, false,
                    0, config.TapeLength - 1);
                break;
            case TapeTypes.RightLimited:
                tape = new LimitedTape(false, true,
                    0, config.TapeLength - 1);
                break;
            case TapeTypes.LeftRightLimited:
                tape = new LimitedTape(true, true,
                    0, config.TapeLength - 1);
                break;
            default:
                throw new ArgumentException($"Invalid tape type: {config.TapeType}");
        }
        
        tape.InitializeContent(config.TapeContent);
        return tape;
    }
    
    /// <summary>
    /// Method for simulator to make TuringMachine objects.
    /// </summary>
    /// <param name="config"> The configuration of the Turing machine. </param>
    public static TuringMachine MakeTuringMachine(TuringMachineConfig config, List<ITape> tapes)
    {
        TuringMachine machine = new TuringMachine();
        machine.IsHalted = false;
        machine.State = SignalState.Other;
        machine.Graph = new TransitionGraph();
        InitializeHeads(machine, config.NumberOfHeads, config.HeadTypes, 
            config.InitialPositions, config.TapesReference, tapes);
        PopulateTransitionGraph(machine, config.Transitions);

        return machine;
    }
    
    /// <summary> Helper method: Populate the transition graph of the given machine. </summary>
    /// <param name="machine"> The target Turing machine. </param>
    /// <param name="transitions"> A list of transitions, represented by statement form. </param>
    private static void PopulateTransitionGraph(
        TuringMachine machine,
        ICollection<TransitionStatement> transitions)
    {
        foreach (var transition in transitions)
            machine.Graph.AddTransition(transition);
    }

    /// <summary> Helper method: Initialize all the heads of the given machine. </summary>
    /// <param name="machine"> The target Turing machine. Allows multiple heads. </param>
    /// <param name="numberOfHeads"> The number of the heads. </param>
    /// <param name="headType"> The head types. Must have the same number of numberOfHeads. </param>
    /// <param name="initialPositions"> The initial head positions. Must have the same number of numberOfHeads. </param>
    /// <param name="tapes"> The tapes the heads have reference at. Must have the same number of numberOfHeads. </param>
    /// <exception cref="ArgumentException"> Throws when the arguments are invalid. See below. </exception>
    private static void InitializeHeads(
        TuringMachine machine,
        int numberOfHeads,
        ICollection<HeadType> headType,
        ICollection<int> initialPositions,
        ICollection<int> tapesReference,
        ICollection<ITape> tapes)
    {
        if (numberOfHeads <= 0 || headType.Count <= 0 || tapes.Count <= 0 || initialPositions.Count <= 0)
            throw new ArgumentException("Must provide at least one initialized head.");
        
        if (headType.Count != initialPositions.Count 
            || headType.Count != tapes.Count 
            || headType.Count != numberOfHeads)
            throw new ArgumentException("Arguments must have the same number of heads.");
        
        // New an array of heads for the given machine.
        IHead[] heads = new IHead[numberOfHeads];
        for (int i = 0; i < numberOfHeads; i++)
        {
            IHead head;
            switch (headType.ElementAt(i))
            {
                case HeadType.ReadWrite:
                    head = new ReadWriteHead(tapes.ElementAt(i));
                    break;
                case HeadType.WriteOnly:
                    head = new WriteOnlyHead(tapes.ElementAt(i));
                    break;
                case HeadType.ReadOnly:
                    head = new ReadOnlyHead(tapes.ElementAt(i));
                    break;
                default:
                    throw new ArgumentException($"Invalid head type: {headType.ElementAt(i)}");
            }
            
            head.Position = initialPositions.ElementAt(i);
            head.TapeID = tapesReference.ElementAt(i);
            heads[i] = head;
        }
        
        machine.Heads = heads;
    }
}