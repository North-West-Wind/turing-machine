namespace TuringMachine.Backend.Server.Database.Entity.MachineStorage
{
    internal class TransitionStatement
    {
        public Guid   TransitionID   { get; set; }
        public byte   StatementIndex { get; set; }
        public string Read           { get; set; }
        public string Write          { get; set; }
        public int    Move           { get; set; }


        #region Relationship
        public Transition BelongedTransition { get; set; }
        #endregion
    }
}