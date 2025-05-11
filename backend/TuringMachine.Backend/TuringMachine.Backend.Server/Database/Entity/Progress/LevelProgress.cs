using TuringMachine.Backend.Server.Database.Entity.Level;
using TuringMachine.Backend.Server.Database.Entity.Machine;
using TuringMachine.Backend.Server.Database.Entity.UserManagement;

namespace TuringMachine.Backend.Server.Database.Entity.Progress
{
    internal class LevelProgress
    {
        public Guid     UUID           { get; set; }
        public byte     LevelID        { get; set; }
        public bool     IsSolved       { get; set; }
        public Guid?    DesignID       { get; set; }
        public DateTime SubmissionTime { get; set; }
        public int      Operations     { get; set; }


        #region Relation
        public User User { get; set; }

        public LevelInfo      LevelInfo { get; set; }
        public MachineDesign? Solution  { get; set; }
        #endregion
    }
}
