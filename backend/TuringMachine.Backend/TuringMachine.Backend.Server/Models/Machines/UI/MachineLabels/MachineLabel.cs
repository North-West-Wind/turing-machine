namespace TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels
{
    internal class MachineLabel
    {
        public string? Title { get; set; }
        public int     Color { get; set; }

        public IList<MachineBoxLabel?>  Boxes { get; set; }
        public IList<MachineTextLabel?> Texts { get; set; }
        public IList<MachineNodeLabel?> Nodes { get; set; }
    }
}
