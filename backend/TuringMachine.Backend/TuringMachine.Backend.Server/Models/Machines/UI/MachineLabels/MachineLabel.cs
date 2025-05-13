using System.Text.Json.Serialization;

namespace TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels
{
    internal class MachineLabel
    {
        public string? Title { get; set; }
        public int     Color { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public IList<MachineBoxLabel?>? Boxes { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public IList<MachineTextLabel?>? Texts { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public IList<MachineNodeLabel?>? Nodes { get; set; }
    }
}
