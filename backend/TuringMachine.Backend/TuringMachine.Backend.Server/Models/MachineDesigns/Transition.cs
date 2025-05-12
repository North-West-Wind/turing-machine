namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class Transition
    {
        public short SourceNodeID { get; set; }
        public short TargetNodeID { get; set; }

        public IList<TransitionStatement> Statements { get; set; }
    }
}