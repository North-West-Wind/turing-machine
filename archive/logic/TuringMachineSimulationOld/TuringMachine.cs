using ECS.TuringMachineLib.Tape;
using ECS.TuringMachineLib.Head;

namespace ECS.TuringMachineLib;

public class TuringMachine
{
    public ITape[] Tapes { get; set; }
    public IHead[] Heads { get; set; }
    public TuringMachineState[] State { get; set; }
    public Signal PauseInput { get; set; }
    public Dictionary<string, (char[], int, bool[])>[] TransitionGraph { get; set; }
    public bool IsHalted { get; set; }
}