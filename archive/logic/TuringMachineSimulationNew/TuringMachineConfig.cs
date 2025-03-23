using TuringMachineSimulation.Logic.States.Transition;
using TuringMachineSimulation.Logic.Tapes;
using TuringMachineSimulation.Logic.Heads;

namespace TuringMachineSimulation.Logic
{
    public class TuringMachineConfig
    {
        public int NumberOfHeads { get; set; }
        public ICollection<HeadType> HeadTypes { get; set; } = new List<HeadType>();
        public ICollection<int> InitialPositions { get; set; } = new List<int>();
        public ICollection<int> TapesReference { get; set; } = new List<int>();
        public ICollection<TransitionNode> TransitionNodes { get; set; } = new List<TransitionNode>();
        public ICollection<TransitionStatement> Transitions { get; set; } = new List<TransitionStatement>();
        public TransitionNode StartNode { get; set; }

        public TuringMachineConfig(
            int numberOfHeads, 
            ICollection<HeadType> headTypes, 
            ICollection<int> initialPositions, 
            ICollection<int> tapesReference, 
            ICollection<TransitionNode> transitionNodes,
            ICollection<TransitionStatement> transitions,
            TransitionNode startNode)
        {
            NumberOfHeads = numberOfHeads;
            HeadTypes = headTypes;
            InitialPositions = initialPositions;
            TapesReference = tapesReference;
            TransitionNodes = transitionNodes;
            Transitions = transitions;
            StartNode = startNode;
        }
    }
}