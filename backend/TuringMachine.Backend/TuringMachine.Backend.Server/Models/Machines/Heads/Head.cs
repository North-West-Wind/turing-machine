namespace TuringMachine.Backend.Server.Models.Machines.Heads
{
    internal class Head
    {
        public short HeadOrderIndex { get; set; }
        public short TapeID { get; set; }

        public HeadType Type { get; set; }
        public int Position { get; set; }
    }
}