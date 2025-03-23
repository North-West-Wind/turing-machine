using TuringMachineSimulation.Logic.Tapes;
using TuringMachineSimulation.Logic.Tapes.TapesUtilities;

namespace TuringMachineSimulation.Logic.Heads
{
    internal class ReadOnlyHead : IHead
    {
        public HeadType Type => HeadType.ReadOnly;

        public int Position { get; set; }

        private readonly ITape _tape;
        
        public int TapeID { get; set; }

        /// <summary>
        /// ReadOnlyHead constructor, accepts a tape object for operations. Cannot change later.
        /// </summary>
        /// <param name="tape"> an ITape object. </param>
        public ReadOnlyHead(ITape tape)
        {
            _tape = tape;
        }
        
        public char? GetCurrentContent()
        {
            _tape.TryRead(Position, out var currentContent);
            return currentContent;
        }
        
        public void Move(int steps)
        { 
            Position = _tape.GetMovedPosition(Position, steps);
        }
        
        public bool TryWrite(char content, int machineID, int headID)
        {
            // Should never allow read-only head to write
            if (content != TapeSymbols.None)
                return false;

            return true;
        }
        
        public bool IsUsesTape(ITape tape)
        {
            return object.ReferenceEquals(_tape, tape);
        }
    }
}
