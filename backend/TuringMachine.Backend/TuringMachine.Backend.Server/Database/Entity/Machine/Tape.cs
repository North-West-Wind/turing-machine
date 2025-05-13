using TuringMachine.Backend.Server.Models.Machines.Tapes;

namespace TuringMachine.Backend.Server.Database.Entity.Machine
{
    internal class Tape
    {
        public Guid     TapeID     { get; set; }
        public Guid     DesignID   { get; set; }
        public byte     TapeIndex  { get; set; }
        public TapeType TapeType   { get; set; }
        public string?  TapeValues { get; set; }
        public bool     IsInput    { get; set; }
        public bool     IsOutput   { get; set; }


        #region Relation
        public MachineDesign MachineDesign { get; set; }
        #endregion
    }
}
