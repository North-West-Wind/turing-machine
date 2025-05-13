using TuringMachine.Backend.Server.Models.UserInterface;

namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class MachineUIConfigPair
    {
        public UILabel       UILabel       { get; set; }
        public MachineConfig MachineConfig { get; set; }
    }
}