namespace TuringMachine.Backend.Server.Data.SqlDataModel.UI.MachineLabels
{
    internal class NodeLabel
    {
        public Guid   MachineLabelID { get; set; }
        public string Label          { get; set; }
        public int    PosX           { get; set; }
        public int    PosY           { get; set; }
        public byte   LabelIndex     { get; set; }


        #region Relationship
        public MachineLabel MachineLabel { get; set; }
        #endregion
    }
}
