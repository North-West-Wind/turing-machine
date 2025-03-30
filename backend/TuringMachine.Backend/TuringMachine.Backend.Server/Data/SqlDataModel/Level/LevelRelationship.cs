namespace TuringMachine.Backend.Server.Data.SqlDataModel.Level
{
    internal class LevelRelationship
    {
        public byte ParentLevel { get; set; }
        public byte ChildLevel  { get; set; }


        #region Relation
        public LevelInfo ParentLevelNavigation { get; set; }
        public LevelInfo ChildLevelNavigation  { get; set; }
        #endregion
    }
}
