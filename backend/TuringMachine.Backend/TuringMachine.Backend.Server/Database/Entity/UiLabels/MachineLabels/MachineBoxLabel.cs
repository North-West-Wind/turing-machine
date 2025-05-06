namespace TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels
{
    internal class MachineBoxLabel
    {
        public Guid  MachineLabelID { get; set; }
        public float StartX         { get; set; }
        public float StartY         { get; set; }
        public float Width          { get; set; }
        public float Height         { get; set; }
        public int   Color          { get; set; }
        public byte  LabelIndex     { get; set; }


        #region Relationship
        public MachineLabel MachineLabel { get; set; }
        #endregion
    }
}
