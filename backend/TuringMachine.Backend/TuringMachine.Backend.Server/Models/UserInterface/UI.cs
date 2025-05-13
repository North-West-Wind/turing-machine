using TuringMachine.Backend.Server.Models.UserInterface.HighlightBoxes;
using TuringMachine.Backend.Server.Models.UserInterface.Nodes;
using TuringMachine.Backend.Server.Models.UserInterface.TextLabels;

namespace TuringMachine.Backend.Server.Models.UserInterface
{
    internal class UI
    {
        public int Color { get; set; }

        public ICollection<TransitionLine> TransitionLines { get; set; }
        public IList<HighlightBox>         HighlightBoxes  { get; set; }
        public ICollection<TextLabel>      TextLabels      { get; set; }
        public ICollection<Node>           Nodes           { get; set; }
    }
}