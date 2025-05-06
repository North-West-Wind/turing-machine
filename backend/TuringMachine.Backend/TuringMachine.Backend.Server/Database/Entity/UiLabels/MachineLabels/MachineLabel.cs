namespace TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels
{
    internal class MachineLabel
    {
        public Guid   MachineLabelID { get; set; }
        public Guid   MachineID      { get; set; }
        public string Title          { get; set; }
        public int    Color          { get; set; }


        #region Relation
        public Machine.Machine Machine { get; set; }

        public ICollection<MachineBoxLabel> BoxLabels  { get; set; }
        public ICollection<TextLabel>       TextLabels { get; set; }
        public ICollection<NodeLabel>       NodeLabels { get; set; }
        #endregion
    }
}
