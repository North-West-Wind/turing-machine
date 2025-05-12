using TuringMachine.Backend.Server.Models.Machine.Transitions;
using TuringMachine.Backend.Server.Models.Machine.Heads;

namespace TuringMachine.Backend.Server.Models.Machine
{
    internal class MachineConfig
    {
        public ICollection<Transition> Transitions { get; set; }

        public ICollection<Head> Heads { get; set; }
    }
}