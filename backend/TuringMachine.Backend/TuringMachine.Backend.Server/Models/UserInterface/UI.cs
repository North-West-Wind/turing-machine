using TuringMachine.Backend.Server.Models.UserInterface.HighlightBoxes;
using TuringMachine.Backend.Server.Models.UserInterface.Nodes;
using TuringMachine.Backend.Server.Models.UserInterface.TextLabels;

namespace TuringMachine.Backend.Server.Models.UserInterface
{
    internal class UI
    {
        public int Color { get; set; }
        
        public TransitionLine[] TransitionLines { get; set; }
        public HighlightBox[] HighlightBoxes { get; set; }
        public TextLabel[] TextLabels { get; set; }
        public Node[] Nodes { get; set; }
    }
}