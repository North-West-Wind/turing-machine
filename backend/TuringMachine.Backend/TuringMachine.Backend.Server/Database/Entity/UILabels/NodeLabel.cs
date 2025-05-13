namespace TuringMachine.Backend.Server.Database.Entity.UILabels
{
    internal class NodeLabel
    {
        public Guid   UILabelID { get; set; }
        public short  NodeID    { get; set; }
        public double X         { get; set; }
        public double Y         { get; set; }
        public bool   IsFinal   { get; set; }


        #region Relationship
        public UIInfo BelongedUI { get; set; }
        #endregion
    }
}