namespace TuringMachine.Backend.Server.Database.Entity.Level
{
    internal class TestCase
    {
        public byte   TestCaseIndex { get; set; }
        public string Input         { get; set; }
        public string Output        { get; set; }
        public byte   LevelID       { get; set; }


        #region Relationship
        public LevelInfo LevelInfo { get; set; }
        #endregion
    }
}
