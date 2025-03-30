using TuringMachine.Backend.Server.Models.Machine.Tapes;

namespace TuringMachine.Backend.Server.Data.SqlDataModel.Machine
{
    internal class Tape
    {
        public Guid     TapeID    { get; set; }
        public Guid     DesignID  { get; set; }
        public byte     TapeIndex { get; set; }
        public TapeType TapeType  { get; set; }
        public string?  TapeValue { get; set; }


        #region Relation
        public MachineDesign MachineDesign { get; set; }
        #endregion
    }
}
