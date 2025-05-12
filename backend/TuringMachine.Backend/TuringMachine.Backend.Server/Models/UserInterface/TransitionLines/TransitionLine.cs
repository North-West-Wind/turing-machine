namespace TuringMachine.Backend.Server.Models.UserInterface
{
    internal class TransitionLine
    {
        public Point Source { get; set; }
        public Step[] Steps { get; set; }
    }
}