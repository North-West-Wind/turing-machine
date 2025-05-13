namespace TuringMachine.Backend.Server.Database.Entity.UILabels
{
    internal class TextLabel
    {
        public Guid   UILabelID { get; set; }
        public double X         { get; set; }
        public double Y         { get; set; }
        public string Value     { get; set; }

        public short TextIndex { get; set; }

        #region Relationship
        public UIInfo BelongedUI { get; set; }
        #endregion
    }
}