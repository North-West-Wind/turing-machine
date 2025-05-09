using System.Numerics;
using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.GlobalOptions.CustomJsonConverter;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels
{
    internal class MachineTextLabel
    {
        [JsonConverter(typeof(Vector2JsonConverter))]
        public Vector2 Position { get; set; }
        public string  Value    { get; set; }
    }
}
