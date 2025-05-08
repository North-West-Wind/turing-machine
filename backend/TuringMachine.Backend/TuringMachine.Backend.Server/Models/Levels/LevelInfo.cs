using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines;

namespace TuringMachine.Backend.Server.Models.Levels
{
    internal class LevelInfo
    {
        public byte   LevelID     { get; set; }
        public string Title       { get; set; }
        public string Description { get; set; }

        public ICollection<byte> Parents  { get; set; }
        public ICollection<byte> Children { get; set; }

        public ICollection<TestCase>? TestCases   { get; set; }
        public Constraint             Constraints { get; set; }

        public bool IsSolved { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public TuringMachineDesign? Design { get; set; }
    }
}
