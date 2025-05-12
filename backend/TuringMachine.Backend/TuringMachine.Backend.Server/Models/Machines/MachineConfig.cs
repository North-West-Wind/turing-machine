using TuringMachine.Backend.Server.Models.Machines.Transitions;
using TuringMachine.Backend.Server.Models.Machines.Heads;

namespace TuringMachine.Backend.Server.Models.Machines
{
    internal class MachineConfig
    {
        public ICollection<Transition> Transitions { get; set; }

        public ICollection<Head> Heads { get; set; }
    }
}