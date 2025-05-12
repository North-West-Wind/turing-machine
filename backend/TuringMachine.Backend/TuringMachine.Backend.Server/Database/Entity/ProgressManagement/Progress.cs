namespace TuringMachine.Backend.Server.Database.Entity.ProgressManagement
{
    internal class Progress
    {
        public Guid     UUID          { get; set; }
        public byte     LevelID       { get; set; }
        public DateTime SubmittedTime { get; set; }
        public Guid     DesignID      { get; set; }
        public bool     IsSolved      { get; set; }
    }
}