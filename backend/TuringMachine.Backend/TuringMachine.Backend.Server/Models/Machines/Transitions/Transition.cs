namespace TuringMachine.Backend.Server.Models.Machines.Transitions
{
    internal class Transition
    {
        public short SourceNodeID { get; set; }
        public short TargetNodeID { get; set; }

        public ICollection<TransitionStatement> Statements { get; set; }
    }
}