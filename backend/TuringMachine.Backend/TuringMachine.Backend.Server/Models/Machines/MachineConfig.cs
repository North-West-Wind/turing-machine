using TuringMachine.Backend.Server.Models.Machine.Transitions;
using TuringMachine.Backend.Server.Models.Machine.Heads;

namespace TuringMachine.Backend.Server.Models.Machine
{
    internal class MachineConfig
    {
        public Transition[] Transitions { get; set; }
        
        public Head[] Heads { get; set; }
    }
}