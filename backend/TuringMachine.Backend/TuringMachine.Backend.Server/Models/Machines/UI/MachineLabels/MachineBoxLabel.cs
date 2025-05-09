using System.Numerics;
using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.GlobalOptions.CustomJsonConverter;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels
{
    public class MachineBoxLabel
    {
        [JsonConverter(typeof(Vector2JsonConverter))]
        public Vector2 Start { get; set; }

        [JsonConverter(typeof(Vector2JsonConverter))]
        public Vector2 Size { get; set; }

        public int     Color { get; set; }
    }
}
