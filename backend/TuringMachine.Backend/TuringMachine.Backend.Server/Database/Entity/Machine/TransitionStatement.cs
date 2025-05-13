namespace TuringMachine.Backend.Server.Database.Entity.Machine
{
    internal class TransitionStatement
    {
        public Guid  TransitionID   { get; set; }
        public byte  StatementIndex { get; set; }
        public char  Read           { get; set; }
        public char  Write          { get; set; }
        public short Move           { get; set; }

        #region Relationship
        public Transition Transition { get; set; }
        #endregion
    }
}
