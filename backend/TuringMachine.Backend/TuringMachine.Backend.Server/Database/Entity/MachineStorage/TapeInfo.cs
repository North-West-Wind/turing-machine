using TuringMachine.Backend.Server.Models.MachineDesigns;

namespace TuringMachine.Backend.Server.Database.Entity.MachineStorage
{
    internal class TapeInfo
    {
        public Guid     DesignID      { get; set; }
        public short    TapeIndex     { get; set; }
        public TapeType TapeType      { get; set; }
        public string?  InitialValues { get; set; }


        #region Relationship
        public MachineDesign BelongedDesign { get; set; }
        #endregion
    }
}