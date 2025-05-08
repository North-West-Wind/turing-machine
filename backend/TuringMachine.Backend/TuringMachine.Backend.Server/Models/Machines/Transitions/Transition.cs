using System.Numerics;
using TuringMachine.Backend.Server.Database.Entity.UiLabels;

namespace TuringMachine.Backend.Server.Models.Machines.Transitions
{
    internal class Transition
    {
        public byte Source { get; set; }
        public byte Target { get; set; }

        public IList<TransitionStatement> Statements { get; set; }

        public IList<Vector2> TransitionLineSteps { get; set; }
    }
}
