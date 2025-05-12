namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class Tape
    {
        public TapeType Type          { get; set; }
        public string?  InitialValues { get; set; }
    }
}