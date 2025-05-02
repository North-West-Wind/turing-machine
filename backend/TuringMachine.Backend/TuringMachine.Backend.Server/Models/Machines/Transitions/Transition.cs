namespace TuringMachine.Backend.Server.Models.Machines.Transitions
{
    internal class Transition
    {
        public byte Source { get; set; }
        public byte Target { get; set; }

        public ICollection<TransitionStatement> Statements { get; set; }
    }
}
