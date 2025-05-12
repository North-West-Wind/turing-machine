using System.Data;
using System.Text.Json.Serialization;

namespace TuringMachine.Backend.Server.Models.LevelTemplates
{
    internal class LevelTemplate
    {
        public byte   LevelID     { get; set; }
        public string Title       { get; set; }
        public string Description { get; set; }


        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public byte? ParentID { get; set; }

        public ICollection<byte> ChildrenID { get; set; }


        public ICollection<TestCase> TestCases { get; set; }

        public Constraint Constraints { get; set; }


        #region Statistic
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MinTransitionCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MinStateCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MinHeadCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MinTapeCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MinOperationCount { get; set; }


        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MaxTransitionCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MaxStateCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MaxHeadCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MaxTapeCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MaxOperationCount { get; set; }
        #endregion
    }
}