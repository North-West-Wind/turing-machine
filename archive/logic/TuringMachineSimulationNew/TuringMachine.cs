using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TuringMachineSimulation.Logic.Heads;
using TuringMachineSimulation.Logic.States;
using TuringMachineSimulation.Logic.States.Transition;
using TuringMachineSimulation.Logic.Tapes;

namespace TuringMachineSimulation.Logic
{
    public class TuringMachine // Do not allow any direct set on those properties. Some sort of factory is needed for converting string based input of the transition graph into this object.
    {
        public IHead[] Heads { get; internal set; }
        public TransitionGraph Graph { get; internal set; }
        public SignalState State { get; internal set; }
        public bool IsHalted { get; internal set; }
    }
}
