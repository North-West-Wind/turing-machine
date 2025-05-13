namespace TuringMachine.Backend.Server.Database.Entity.UILabels
{
    internal class TextLabel
    {
        public Guid   UILabelID { get; set; }
        public float  X         { get; set; }
        public float  Y         { get; set; }
        public string Value     { get; set; }
        
        public short  TextIndex { get; set; }
        
        #region Relationship
        public UIInfo BelongedUI { get; set; }
        #endregion
    }
}