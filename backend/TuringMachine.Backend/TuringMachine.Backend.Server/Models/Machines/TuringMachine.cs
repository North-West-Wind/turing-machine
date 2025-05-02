using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines.Heads;
using TuringMachine.Backend.Server.Models.Machines.Transitions;
using TuringMachine.Backend.Server.Models.Machines.UI;

namespace TuringMachine.Backend.Server.Models.Machines
{
    internal class TuringMachine
    {
        public ICollection<Transition> Transitions { get; set; }
        public ICollection<Head>       Heads       { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public MachineLabel?           Label       { get; set; }
    }
}
