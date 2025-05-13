namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class Head
    {
        public short TapeID { get; set; }

        public HeadType Type { get; set; }
        public int Position { get; set; }
    }
}