using System.Numerics;
using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Database.Entity.UiLabels;
using TuringMachine.Backend.Server.GlobalOptions.CustomJsonConverter;

namespace TuringMachine.Backend.Server.Models.Machines.Transitions
{
    internal class Transition
    {
        public byte Source { get; set; }
        public byte Target { get; set; }

        public IList<TransitionStatement> Statements { get; set; }

        [JsonConverter(typeof(Vector2IListJsonConverter))]
        public IList<Vector2>? TransitionLineSteps { get; set; }
    }
}
