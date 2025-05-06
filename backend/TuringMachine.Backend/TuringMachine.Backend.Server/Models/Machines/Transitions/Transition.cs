using System.Numerics;
using TuringMachine.Backend.Server.Database.Entity.UiLabels;

namespace TuringMachine.Backend.Server.Models.Machines.Transitions
{
    internal class Transition
    {
        public byte Source { get; set; }
        public byte Target { get; set; }

        public ICollection<TransitionStatement> Statements { get; set; }

        public ICollection<Vector2> TransitionLineSteps { get; set; }
    }
}
