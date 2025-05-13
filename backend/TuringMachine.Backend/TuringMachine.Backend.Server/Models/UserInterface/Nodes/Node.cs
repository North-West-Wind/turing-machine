namespace TuringMachine.Backend.Server.Models.UserInterface.Nodes
{
    internal class Node
    {
        public short NodeID  { get; set; }
        public float X       { get; set; }
        public float Y       { get; set; }
        public bool  IsFinal { get; set; }
    }
}