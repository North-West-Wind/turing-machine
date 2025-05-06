namespace TuringMachine.Backend.Server.Models.Machines.UI
{
    internal class MachineLabel
    {
        public string Title { get; set; }
        public int    Color { get; set; }

        public ICollection<MachineBoxLabel>  Boxes { get; set; }
        public ICollection<MachineTextLabel> Texts { get; set; }
        public ICollection<MachineNodeLabel> Nodes { get; set; }
    }
}
