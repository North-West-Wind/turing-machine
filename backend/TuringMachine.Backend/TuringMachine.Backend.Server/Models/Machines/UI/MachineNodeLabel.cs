using System.Numerics;
using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.Models.Machines.UI
{
    internal class MachineNodeLabel
    {
        public string  Label    { get; set; }
        public Vector2 Position { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public bool IsFinal { get; set; } = false;
    }
}
