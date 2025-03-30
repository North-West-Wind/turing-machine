namespace TuringMachine.Backend.Server.Data.SqlDataModel.UI.MachineLabels
{
    internal class MachineBoxLabel
    {
        public Guid  MachineLabelID { get; set; }
        public int   StartX         { get; set; }
        public int   StartY         { get; set; }
        public short Width          { get; set; }
        public short Height         { get; set; }
        public int   Color          { get; set; }
        public byte  LabelIndex     { get; set; }


        #region Relationship
        public MachineLabel MachineLabel { get; set; }
        #endregion
    }
}
