using TuringMachine.Backend.Server.Data.SqlDataModel.Progress;

namespace TuringMachine.Backend.Server.Data.SqlDataModel.Machine
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
