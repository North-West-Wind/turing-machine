namespace TuringMachine.Backend.Server.Models.Machine.Transitions
{
    internal class TransitionStatement
    {
        public short TapeID { get; set; }
        public char Read { get; set; }
        public char Write { get; set; }
        public int Move { get; set; }
    }
}