using System.Text.Json.Serialization;

namespace TuringMachine.Backend.Server.Models.Misc
{
    internal class ConstraintRange
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public byte? Min { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public byte? Max { get; set; }
    }
}
