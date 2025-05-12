namespace TuringMachine.Backend.Server.Database.Entity.MachineStorage
{
    internal class Transition
    {
        public Guid  TransitionID    { get; set; }
        public Guid  MachineID       { get; set; }
        public short TransitionIndex { get; set; }
        public short SourceNodeIndex { get; set; }
        public short TargetNodeIndex { get; set; }


        #region Relationship
        public Machine                          BelongedMachine      { get; set; }
        public ICollection<TransitionStatement> TransitionStatements { get; set; }
        #endregion
    }
}