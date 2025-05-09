using System.Numerics;
using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.GlobalOptions.CustomJsonConverter;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels
{
    internal class MachineNodeLabel
    {
        public string  Label    { get; set; }

        [JsonConverter(typeof(Vector2JsonConverter))]
        public Vector2 Position { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public bool IsFinal { get; set; } = false;
    }
}
