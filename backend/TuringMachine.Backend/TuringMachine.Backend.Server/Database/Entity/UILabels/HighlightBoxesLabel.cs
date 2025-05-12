namespace TuringMachine.Backend.Server.Database.Entity.UILabels
{
    internal class HighlightBoxesLabel
    {
        public Guid   UILabelID { get; set; }
        public short  BoxIndex  { get; set; }
        public string Title     { get; set; }
        public float  X         { get; set; }
        public float  Y         { get; set; }
        public float  Width     { get; set; }
        public float  Height    { get; set; }
        public int    Color     { get; set; }


        #region Relationship
        public UIInfo BelongedUI { get; set; }
        #endregion
    }
}