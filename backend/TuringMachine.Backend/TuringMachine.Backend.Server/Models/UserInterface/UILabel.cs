using TuringMachine.Backend.Server.Models.UserInterface.HighlightBoxes;
using TuringMachine.Backend.Server.Models.UserInterface.Nodes;
using TuringMachine.Backend.Server.Models.UserInterface.TextLabels;

namespace TuringMachine.Backend.Server.Models.UserInterface
{
    internal class UILabel
    {
        public int Color { get; set; }

        public ICollection<TransitionLine> TransitionLines { get; set; }
        public IList<HighlightBox>         HighlightBoxes  { get; set; }
        public IList<TextLabel>            TextLabels      { get; set; }
        public ICollection<Node>           Nodes           { get; set; }
    }
}