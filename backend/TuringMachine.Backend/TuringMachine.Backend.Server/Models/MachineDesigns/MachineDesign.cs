using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines.Tapes;
using TuringMachine.Backend.Server.Models.Machines.Transitions;

namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class MachineDesign
    {
        public Guid Author  { get; set; }
        public byte LevelID { get; set; }

        public TapeInfo                   TapeInfo { get; set; }
        public ICollection<MachineDesign> Machines { get; set; }


        #region Statistics
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MaxTransition { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? TransitionCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? StateCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? HeadCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? TapeCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? OperationCount { get; set; }
        #endregion
    }
}