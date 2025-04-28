using TuringMachineSimulation.Logic.Tapes;

namespace TuringMachineSimulation.Logic.Heads
{
    internal class ReadWriteHead : IHead
    {
        public HeadType Type => HeadType.ReadWrite;

        public int Position { get; set; }

        private readonly ITape _tape;

        public int TapeID { get; set; }

        /// <summary>
        /// ReadWriteHead constructor, accepts a tape object for operations. Cannot change later.
        /// </summary>
        /// <param name="tape"> an ITape object. </param>
        public ReadWriteHead(ITape tape)
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
            catch (InvalidOperationException ex)
            {
                Console.WriteLine(ex.Message);
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
