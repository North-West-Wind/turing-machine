namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class TapeInfo
    {
        public short InputTape  { get; set; }
        public short OutputTape { get; set; }

        public IList<Tape> Tapes { get; set; }
    }
}