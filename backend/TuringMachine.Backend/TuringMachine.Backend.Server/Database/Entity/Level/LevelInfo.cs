using TuringMachine.Backend.Server.Database.Entity.Progress;

namespace TuringMachine.Backend.Server.Database.Entity.Level
{
    internal class LevelInfo
    {
        public byte   LevelID     { get; set; }
        public string Title       { get; set; }
        public string Description { get; set; }

        public bool  HasStateLimit { get; set; }
        public byte? MaxState      { get; set; }
        public byte? MinState      { get; set; }

        public bool  HasTransitionLimit { get; set; }
        public byte? MaxTransition      { get; set; }
        public byte? MinTransition      { get; set; }

        public bool  HasTapeLimit { get; set; }
        public byte? MaxTape      { get; set; }
        public byte? MinTape      { get; set; }

        public bool  HasHeadLimit { get; set; }
        public byte? MaxHead      { get; set; }
        public byte? MinHead      { get; set; }

        public bool AllowInfiniteTape         { get; set; }
        public bool AllowLeftLimitedTape      { get; set; }
        public bool AllowRightLimitedTape     { get; set; }
        public bool AllowLeftRightLimitedTape { get; set; }
        public bool AllowCircularTape         { get; set; }


        #region Relation
        public LevelProgress? LevelProgress { get; set; }

        public ICollection<LevelRelationship> ParentLevels { get; set; }
        public ICollection<LevelRelationship> ChildLevels  { get; set; }

        public ICollection<TestCase> TestCases { get; set; }
        #endregion
    }
}
