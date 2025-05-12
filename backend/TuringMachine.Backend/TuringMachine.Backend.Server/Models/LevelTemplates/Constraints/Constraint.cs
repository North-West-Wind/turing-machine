using System.Text.Json.Serialization;

namespace TuringMachine.Backend.Server.Models.LevelTemplates.Constraints
{
    internal class Constraint
    {
        #region Minnimal Constraint
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MinState { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MinHead { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MinTape { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MinTransition { get; set; }
        #endregion


        #region Maximal Constraint
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MaxState { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MaxHead { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MaxTape { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MaxTransition { get; set; }
        #endregion


        public bool AllowInfinite         { get; set; }
        public bool AllowLeftLimited      { get; set; }
        public bool AllowRightLimited     { get; set; }
        public bool AllowLeftRightLimited { get; set; }
        public bool AllowCircular         { get; set; }
    }
}