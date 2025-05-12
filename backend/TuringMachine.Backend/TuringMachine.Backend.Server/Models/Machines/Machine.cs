using TuringMachine.Backend.Server.Models.UserInterface;

namespace TuringMachine.Backend.Server.Models.Machine
{
    internal class Machine
    {
        public UI UI { get; set; }
        public MachineConfig MachineConfig { get; set; }
        public short StartNode { get; set; }
    }
}