using TuringMachine.Backend.Server.Data.SqlDataModel.Level;
using TuringMachine.Backend.Server.Data.SqlDataModel.Machine;
using TuringMachine.Backend.Server.Data.SqlDataModel.UserManagement;

namespace TuringMachine.Backend.Server.Data.SqlDataModel.Progress
{
    internal class LevelProgress
    {
        public Guid  UUID     { get; set; }
        public byte  LevelID  { get; set; }
        public bool  IsSolved { get; set; }
        public Guid? DesignID { get; set; }


        #region Relation
        public User User { get; set; }

        public LevelInfo     LevelInfo { get; set; }
        public MachineDesign Solution  { get; set; }
        #endregion
    }
}
