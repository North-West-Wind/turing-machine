namespace TuringMachine.Backend.Server.Models.Machine.Transitions
{
    internal class Transition
    {
        public short SourceNodeID { get; set; }
        public short TargetNodeID { get; set; }
        
        public TransitionStatement[] Statements { get; set; }
    }
}