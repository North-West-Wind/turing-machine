using TuringMachineSimulation.Logic.Tapes;
using TuringMachineSimulation.Logic.Tapes.TapesUtilities;
using InvalidOperationException = System.InvalidOperationException;

namespace TuringMachineSimulation.Logic.Heads
{
    internal class WriteOnlyHead : IHead
    {
        public HeadType Type => HeadType.WriteOnly;

        public int Position { get;  set; }

        private readonly ITape _tape;
        
        public int TapeID { get; set; }

        /// <summary>
        /// WriteOnlyHead constructor, accepts a tape object for operations. Cannot change later.
        /// </summary>
        /// <param name="tape"> an ITape object. </param>
        public WriteOnlyHead(ITape tape)
        {
            _tape = tape;
        }
        
        public char? GetCurrentContent()
        {
            return TapeSymbols.None;
        }
        
        public void Move(int steps)
        { 
            Position = _tape.GetMovedPosition(Position, steps);
        }
        
        public bool TryWrite(char content, int machineID, int headID)
        {
            try
            {
                _tape.ScheduleWrite(Position, content, machineID, headID);
            }
            catch (ArgumentOutOfRangeException)
            {
                Console.WriteLine($"[Error] Position or content is out of range. " +
                                  $"Position: {Position}, Content: {content}.");
                return false;
            }
            catch (InvalidOperationException)
            {
                Console.WriteLine($"[Error] Invalid operation attempted. " +
                                  $"Position: {Position}, Content: {content}.");
                return false;
            }

            return true;
        }
        
        public bool IsUsesTape(ITape tape)
        {
            return object.ReferenceEquals(_tape, tape);
        }
    }
}
