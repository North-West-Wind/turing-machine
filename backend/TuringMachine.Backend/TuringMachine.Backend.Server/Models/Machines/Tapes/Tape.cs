namespace TuringMachine.Backend.Server.Models.Machines.Tapes
{
    internal class Tape
    {
        public TapeType Type          { get; set; }
        public string?  InitialValues { get; set; }
    }
}