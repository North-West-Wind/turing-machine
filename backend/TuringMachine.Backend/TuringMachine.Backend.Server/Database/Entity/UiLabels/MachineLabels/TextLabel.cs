namespace TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels
{
    internal class TextLabel
    {
        public Guid   MachineLabelID { get; set; }
        public int    PosX           { get; set; }
        public int    PosY           { get; set; }
        public string Value          { get; set; }
        public byte   LabelIndex     { get; set; }


        #region Relationship
        public MachineLabel MachineLabel { get; set; }
        #endregion
    }
}
