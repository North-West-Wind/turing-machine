using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TuringMachineSimulation.Logic.States.Transition
{
    // Modify this when needed, just a hint for how graph should be handled.
    public class TransitionNode
    {
        public int StateID;
        
        public override int GetHashCode()
        {
            return StateID.GetHashCode(); // Use stateID as the unique identifier
        }

        public override bool Equals(object obj)
        {
            return obj is TransitionNode other && StateID == other.StateID;
        }

        public TransitionNode(int stateID)
        {
            StateID = stateID;
        }
    }
}
