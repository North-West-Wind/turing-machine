namespace TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels
{
    internal class NodeLabel
    {
        public Guid   MachineLabelID { get; set; }
        public string Label          { get; set; }
        public float  PosX           { get; set; }
        public float  PosY           { get; set; }
        public byte   LabelIndex     { get; set; }
        public bool   IsFinal        { get; set; }

        #region Relationship
        public MachineLabel MachineLabel { get; set; }
        #endregion
    }
}
