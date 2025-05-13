namespace TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels
{
    internal class MachineBoxLabel
    {
        public Guid    MachineLabelID { get; set; }
        public double? StartX         { get; set; }
        public double? StartY         { get; set; }
        public double? Width          { get; set; }
        public double? Height         { get; set; }
        public int?    Color          { get; set; }
        public byte    LabelIndex     { get; set; }


        #region Relationship
        public MachineLabel MachineLabel { get; set; }
        #endregion
    }
}
