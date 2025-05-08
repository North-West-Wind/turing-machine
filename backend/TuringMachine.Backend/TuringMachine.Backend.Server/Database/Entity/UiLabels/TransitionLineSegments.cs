using TuringMachine.Backend.Server.Database.Entity.Machine;

namespace TuringMachine.Backend.Server.Database.Entity.UiLabels
{
    internal class TransitionLinePath
    {
        public Guid   TransitionID { get; set; }
        public byte[] PathX        { get; set; }
        public byte[] PathY        { get; set; }

        #region Relationship
        public Transition Transision;
        #endregion
    }
}
