namespace TuringMachine.Backend.Server.Database.Entity.UILabels
{
    internal class NodeLabel
    {
        public Guid  UILabelID { get; set; }
        public short NodeID    { get; set; }
        public float X         { get; set; }
        public float Y         { get; set; }
        public bool  IsFinal   { get; set; }


        #region Relationship
        public UIInfo BelongedUI { get; set; }
        #endregion
    }
}