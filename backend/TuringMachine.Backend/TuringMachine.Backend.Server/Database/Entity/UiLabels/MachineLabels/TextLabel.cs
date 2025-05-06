namespace TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels
{
    internal class TextLabel
    {
        public Guid   MachineLabelID { get; set; }
        public float  PosX           { get; set; }
        public float  PosY           { get; set; }
        public string Value          { get; set; }
        public byte   LabelIndex     { get; set; }


        #region Relationship
        public MachineLabel MachineLabel { get; set; }
        #endregion
    }
}
