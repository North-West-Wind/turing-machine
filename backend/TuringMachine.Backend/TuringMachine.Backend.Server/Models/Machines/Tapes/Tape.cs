using System.Text.Json.Serialization;

namespace TuringMachine.Backend.Server.Models.Machines.Tapes
{
    internal class Tape
    {
        public TapeType Type   { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string?  Values { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public bool IsInput { get; set; } = false;
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public bool IsOutput { get; set; } = false;
    }
}
