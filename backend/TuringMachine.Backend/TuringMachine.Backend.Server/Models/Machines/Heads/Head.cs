namespace TuringMachine.Backend.Server.Models.Machines.Heads
{
    internal class Head
    {
        public HeadType Type     { get; set; }
        public byte     Tape     { get; set; }
        public short    Position { get; set; }
    }
}
