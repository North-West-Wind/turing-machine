namespace TuringMachine.Backend.Server.Models.UserInterface
{
    internal class TransitionLine
    {
        public Vector2f              Source { get; set; }
        public ICollection<Vector2f> Steps  { get; set; }
    }
}