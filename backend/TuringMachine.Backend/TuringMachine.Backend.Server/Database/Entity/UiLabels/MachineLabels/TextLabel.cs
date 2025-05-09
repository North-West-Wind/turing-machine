namespace TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels
{
    internal class TextLabel
    {
        public Guid    MachineLabelID { get; set; }
        public double? PosX           { get; set; }
        public double? PosY           { get; set; }
        public string? Value          { get; set; }
        public byte    LabelIndex     { get; set; }


        #region Relationship
        public MachineLabel MachineLabel { get; set; }
        #endregion
    }
}
