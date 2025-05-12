namespace TuringMachine.Backend.Server.Models.Machines.Tapes
{
    internal class TapeInfo
    {
        public short InputTape  { get; set; }
        public short OutputTape { get; set; }

        public ICollection<Tape> Tapes { get; set; }
    }
}