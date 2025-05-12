namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class MachineConfig
    {
        public ICollection<Transition> Transitions { get; set; }

        public ICollection<Head> Heads { get; set; }

        public short StartNode { get; set; }
    }
}