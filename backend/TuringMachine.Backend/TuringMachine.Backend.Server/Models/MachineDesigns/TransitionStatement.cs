namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class TransitionStatement
    {
        public short TapeID { get; set; }
        public char  Read   { get; set; }
        public char  Write  { get; set; }
        public int   Move   { get; set; }
    }
}