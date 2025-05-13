using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.Models.UserInterface
{
    internal class TransitionLine
    {
        public Vector2<double>        Source { get; set; }
        public IList<Vector2<double>> Steps  { get; set; }
    }
}