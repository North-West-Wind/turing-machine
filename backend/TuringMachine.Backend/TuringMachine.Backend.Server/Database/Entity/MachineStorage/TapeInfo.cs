namespace TuringMachine.Backend.Server.Database.Entity.MachineStorage
{
    internal class TapeInfo
    {
        public Guid   DesignID      { get; set; }
        public short  TapeIndex     { get; set; }
        public byte   TapeType      { get; set; }
        public string InitialValues { get; set; }


        #region Relationship
        public MachineDesign BelongedDesign { get; set; }
        #endregion
    }
}
