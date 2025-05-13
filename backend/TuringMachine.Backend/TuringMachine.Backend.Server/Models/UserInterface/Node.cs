namespace TuringMachine.Backend.Server.Models.UserInterface
{
    internal class Node
    {
        public short  NodeID  { get; set; }
        public double X       { get; set; }
        public double Y       { get; set; }
        public bool   IsFinal { get; set; }
    }
}