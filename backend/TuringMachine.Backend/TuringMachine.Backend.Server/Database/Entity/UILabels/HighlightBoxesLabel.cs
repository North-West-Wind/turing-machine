namespace TuringMachine.Backend.Server.Database.Entity.UILabels
{
    internal class HighlightBoxesLabel
    {
        public Guid   UILabelID { get; set; }
        public short  BoxIndex  { get; set; }
        public string Title     { get; set; }
        public double X         { get; set; }
        public double Y         { get; set; }
        public double Width     { get; set; }
        public double Height    { get; set; }
        public int    Color     { get; set; }


        #region Relationship
        public UIInfo BelongedUI { get; set; }
        #endregion
    }
}