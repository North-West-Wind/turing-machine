using System.Text.Json.Serialization;

namespace TuringMachine.Backend.Server.Models.Machines.Tapes
{
    internal class Tape
    {
        public TapeType Type   { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public char[]?  Values { get; set; }
    }
}
