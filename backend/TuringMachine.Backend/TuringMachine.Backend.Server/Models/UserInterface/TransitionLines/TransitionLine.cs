namespace TuringMachine.Backend.Server.Models.UserInterface
{
    internal class TransitionLine
    {
        public Vector2<float>        Source { get; set; }
        public IList<Vector2<byte>>  Steps  { get; set; }
    }
}