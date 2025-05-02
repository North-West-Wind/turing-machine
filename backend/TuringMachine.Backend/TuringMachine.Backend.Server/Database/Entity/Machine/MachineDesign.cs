using TuringMachine.Backend.Server.Database.Entity.Progress;

namespace TuringMachine.Backend.Server.Database.Entity.Machine
{
    internal class MachineDesign
    {
        public Guid DesignID { get; set; }


        #region Relation
        public LevelProgress? Progress { get; set; }

        public ICollection<Tape>    Tapes    { get; set; }
        public ICollection<Machine> Machines { get; set; }
        #endregion
    }
}
