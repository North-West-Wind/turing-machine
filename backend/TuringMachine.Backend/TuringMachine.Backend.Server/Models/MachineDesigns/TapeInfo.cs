namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class TapeInfo
    {
        public short InputTape  { get; set; }
        public short OutputTape { get; set; }

        public List<Tape> Tapes { get; set; }
    }
}