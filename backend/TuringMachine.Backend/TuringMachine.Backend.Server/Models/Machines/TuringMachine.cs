using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines.Heads;
using TuringMachine.Backend.Server.Models.Machines.Transitions;
using TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels;

namespace TuringMachine.Backend.Server.Models.Machines
{
    internal class TuringMachine
    {
        public ICollection<Transition> Transitions { get; set; }
        public IList<Head>       Heads       { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public MachineLabel? Label { get; set; }

        public short StartNode { get; set; }
    }
}
