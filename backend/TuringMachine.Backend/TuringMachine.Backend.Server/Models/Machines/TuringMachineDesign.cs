using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines.Tapes;

namespace TuringMachine.Backend.Server.Models.Machines
{
    internal class TuringMachineDesign
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public IList<Tape>? Tapes { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public ICollection<TuringMachine>? Machines { get; set; }
    }
}
