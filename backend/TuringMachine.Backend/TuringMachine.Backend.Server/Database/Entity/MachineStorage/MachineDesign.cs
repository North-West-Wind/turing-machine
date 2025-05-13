using TuringMachine.Backend.Server.Database.Entity.UILabels;

namespace TuringMachine.Backend.Server.Database.Entity.MachineStorage
{
    internal class MachineDesign
    {
        public Guid  DesignID        { get; set; }
        public Guid  Author          { get; set; }
        public byte? LevelID         { get; set; }
        public int   TransitionCount { get; set; }
        public short StateCount      { get; set; }
        public short HeadCount       { get; set; }
        public short TapeCount       { get; set; }
        public int   OperationCount  { get; set; }
        public short InputTapeIndex  { get; set; }
        public short OutputTapeIndex { get; set; }


        #region Relationship
        public ICollection<Machine>  Machines  { get; set; }
        public ICollection<TapeInfo> TapeInfos { get; set; }
        public ICollection<UIInfo>   UIInfos   { get; set; }
        #endregion
    }
}
