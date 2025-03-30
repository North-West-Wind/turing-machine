namespace TuringMachine.Backend.Server.Data.SqlDataModel.Machine
{
    internal class Transition
    {
        public Guid TransitionID { get; set; }
        public Guid MachineID    { get; set; }
        public byte Source       { get; set; }
        public byte Target       { get; set; }


        #region Relation
        public Machine Machine { get; set; }

        public ICollection<TransitionStatement> Statements { get; set; }
        #endregion
    }
}
