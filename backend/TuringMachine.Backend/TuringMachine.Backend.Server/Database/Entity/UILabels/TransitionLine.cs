namespace TuringMachine.Backend.Server.Database.Entity.UILabels
{
    internal class TransitionLine
    {
        public short  TransitionIndex { get; set; }
        public Guid   UILabelID       { get; set; }
        public double SourceX         { get; set; }
        public double SourceY         { get; set; }
        public byte[] StepX           { get; set; }
        public byte[] StepY           { get; set; }


        #region Relationship
        public UIInfo BelongedUI { get; set; }
        #endregion
    }
}