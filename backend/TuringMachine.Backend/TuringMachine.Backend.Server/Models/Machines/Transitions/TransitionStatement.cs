namespace TuringMachine.Backend.Server.Models.Machines.Transitions
{
    internal class TransitionStatement
    {
        public char  Read  { get; set; }
        public char  Write { get; set; }
        public short Move  { get; set; }
    }
}
