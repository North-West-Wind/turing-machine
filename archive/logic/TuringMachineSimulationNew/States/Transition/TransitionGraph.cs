using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TuringMachineSimulation.Logic.States.Transition
{
    /// <summary> Each transitions depend on knowing the source node and the read string (from each head). </summary>
    public class TransitionKey
    {
        public TransitionNode Source { get; set; }
        public string HeadsReads { get; set; }

        public TransitionKey(TransitionNode source, string headsReads)
        {
            Source = source;
            HeadsReads = headsReads;
        }
        
        // Override GetHashCode
        public override int GetHashCode()
        {
            // Combine hash codes of the fields
            int hash = 17; // Start with a prime number
            hash = hash * 31 + (Source != null ? Source.GetHashCode() : 0); // Include Source's hash code
            hash = hash * 31 + (HeadsReads != null ? HeadsReads.GetHashCode() : 0); // Include HeadsReads's hash code
            return hash;
        }

        // Override Equals to ensure equality checks align with GetHashCode
        public override bool Equals(object obj)
        {
            if (obj is TransitionKey other)
            {
                return Equals(Source, other.Source) &&
                       string.Equals(HeadsReads, other.HeadsReads);
            }
            return false;
        }
    }

    /// <summary> The possible move upon reading the string. </summary>
    public class TransitionValue
    {
        public TransitionNode Destination { get; set; }
        public string HeadsWrites { get; set; }
        public ICollection<int> HeadsMoves { get; set; }

        public TransitionValue(TransitionNode destination, string headsWrites, ICollection<int> headsMoves)
        {
            Destination = destination;
            HeadsWrites = headsWrites;
            HeadsMoves = headsMoves;
        }
    }
    
    /// <summary>
    /// Stores a collection of transition nodes.
    /// Maps TransitionKey tot TransitionValues. The relation must be 1 to 0..1.
    /// </summary>
    public class TransitionGraph
    {
        private ICollection<TransitionNode> Nodes = new List<TransitionNode>();
        private IDictionary<TransitionKey , TransitionValue> transitions = new Dictionary<TransitionKey, TransitionValue>();

        /// <summary> Accept a transition statement from UI. Add it to the graph. </summary>
        /// <param name="statement"> A transition statement. </param>
        public void AddTransition(TransitionStatement statement)
        {
            string headsReads = "";
            string headsWrites = "";
            ICollection<int> headsMoves = [];

            foreach (var headTransition in statement.Conditions)
            {
                headsReads += headTransition.Read;
                headsWrites += headTransition.Write;
                headsMoves.Add(headTransition.Moves);
            }
            
            TransitionKey key = new TransitionKey(statement.Source, headsReads);
            TransitionValue value = new TransitionValue(statement.Target, headsWrites, headsMoves);
            
            // Try to add this statement. Do nothing if it already exists.
            transitions.TryAdd(key, value);
        }

        /// <summary> Accept a transition statement from UI. Remove it from the graph.
        /// </br> Note: Do nothing if it doesn't exist </summary>
        /// <param name="statement"> A transition statement. </param>
        public void RemoveTransition(TransitionStatement statement)
        {
            string headsReads = "";
            string headsWrites = "";
            ICollection<int> headsMoves = [];

            foreach (var headTransition in statement.Conditions)
            {
                headsReads += headTransition.Read;
                headsWrites += headTransition.Write;
                headsMoves.Add(headTransition.Moves);
            }
            
            TransitionKey key = new TransitionKey(statement.Source, headsReads);
            TransitionValue value = new TransitionValue(statement.Target, headsWrites, headsMoves);

            // Try to remove this statement if it does exist in the dictionary.
            if (transitions.ContainsKey(key))
                transitions.Remove(key);
        }

        /// <summary> For simulator to try to get the value of transition. </summary>
        /// <param name="key"> TransitionKey object. The transition condition. </param>
        /// <param name="value"> TransitionValue object. The only possible transition. </param>
        /// <returns> True if the value exits, False otherwise. </returns>
        public bool TryGetTransitionValue(TransitionKey key, out TransitionValue value)
        {
            return transitions.TryGetValue(key, out value);
        }
    }
}
