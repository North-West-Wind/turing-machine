using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines.Tapes;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.Models.Levels
{
    internal class Constraint
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public ConstraintRange? States { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public ConstraintRange? Transitions { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public ConstraintRange? Tapes { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public ConstraintRange? Heads { get; set; }

        public ICollection<TapeType> TapeTypes { get; set; }
    }
}
