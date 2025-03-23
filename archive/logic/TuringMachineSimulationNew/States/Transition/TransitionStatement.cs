using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TuringMachineSimulation.Logic.States.Transition
{
    /// <summary> The transition one head should perform. </summary>
    public class HeadTransition
    {
        public char Read;
        public char Write;
        public int Moves;

        public HeadTransition(char read, char write, int moves)
        {
            Read = read;
            Write = write;
            Moves = moves;
        }
    }
    
    /// <summary>
    /// TransitionStatement represents one possible transitions for all heads.
    /// This data structure is not used for simulation, but a simpler representation for UI.
    /// </summary>
    public class TransitionStatement
    {
        public TransitionNode Source;
        public TransitionNode Target;

        public ICollection<HeadTransition> Conditions;

        public TransitionStatement(TransitionNode source, TransitionNode target, ICollection<HeadTransition> conditions)
        {
            Source = source;
            Target = target;
            Conditions = conditions;
        }
    }
}