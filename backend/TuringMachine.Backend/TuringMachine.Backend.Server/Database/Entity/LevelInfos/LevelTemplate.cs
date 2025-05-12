namespace TuringMachine.Backend.Server.Database.Entity.LevelInfos
{
    internal class LevelTemplate
    {
        public byte   LevelID     { get; set; }
        public string Title       { get; set; }
        public string Description { get; set; }

        public byte?   ParentID   { get; set; }
        public byte[]? ChildrenID { get; set; }

        public short? MinState      { get; set; }
        public short? MaxState      { get; set; }
        public short? MinTransition { get; set; }
        public short? MaxTransition { get; set; }
        public short? MinHead       { get; set; }
        public short? MaxHead       { get; set; }
        public short? MinTape       { get; set; }
        public short? MaxTape       { get; set; }

        public bool AllowInfiniteTape         { get; set; }
        public bool AllowLeftLimitedTape      { get; set; }
        public bool AllowRightLimitedTape     { get; set; }
        public bool AllowLeftRightLimitedTape { get; set; }
        public bool AllowCircularTape         { get; set; }


        #region Relationship
        public ICollection<TestCase> TestCases { get; set; }
        #endregion
    }
}
