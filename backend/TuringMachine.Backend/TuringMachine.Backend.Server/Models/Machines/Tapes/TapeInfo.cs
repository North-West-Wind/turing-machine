namespace TuringMachine.Backend.Server.Models.Machine.Tapes
{
    internal class TapeInfo
    {
        public short InputTape { get; set; }
        public short OutputTape { get; set; }

        public Tape[] Tapes { get; set; }
    }
}