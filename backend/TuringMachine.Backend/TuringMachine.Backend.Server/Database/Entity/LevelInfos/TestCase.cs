namespace TuringMachine.Backend.Server.Database.Entity.LevelInfos
{
    internal class TestCase
    {
        public byte   LevelID { get; set; }
        public string Input   { get; set; }
        public string Output  { get; set; }


        #region Relationship
        public LevelTemplate LevelInfo { get; set; }
        #endregion
    }
}