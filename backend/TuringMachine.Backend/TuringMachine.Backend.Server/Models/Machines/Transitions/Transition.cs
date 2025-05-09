using System.Numerics;
using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Database.Entity.UiLabels;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.Models.Machines.Transitions
{
    internal class Transition
    {
        public byte Source { get; set; }
        public byte Target { get; set; }

        public IList<TransitionStatement> Statements { get; set; }

        public IList<Point>? TransitionLineSteps { get; set; }
    }
}
