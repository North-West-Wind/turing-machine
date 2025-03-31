using TuringMachineSimulation.Logic.Tapes.TapesUtilities;

namespace TuringMachineSimulation.Logic.Tapes
{
    internal class CircularTape : ITape
    {
        public TapeTypes Type => TapeTypes.Circular;

        /// <summary>
        /// Stores the tape contents
        /// Blanks are not stored, boundaries of the tape represented by '>' and '<'
        /// </summary>
        public IDictionary<int, char> Tape { get; }
        
        /// <summary>
        /// Stores the scheduled write operations
        /// </summary>
        private Queue<WriteOperation> _writeQueue { get; }

        // Helper attributes for finding the position
        public int LeftBoundary { get; set; }
        public int RightBoundary { get; set; }

        /// <summary> CircularTape constructor, initializes the boundaries of the tape. </summary>
        /// <param name="leftBoundary"> The left boundary. Can be negative. </param>
        /// <param name="rightBoundary"> The right boundary. Can be negative. </param>
        public CircularTape(int leftBoundary = 0, int rightBoundary = 0)
        {
            Tape = new Dictionary<int, char>();
            _writeQueue = new Queue<WriteOperation>();
            
            LeftBoundary = leftBoundary;
            RightBoundary = rightBoundary;
            Tape[LeftBoundary - 1] = TapeSymbols.Start;
            Tape[RightBoundary + 1] = TapeSymbols.End;
        }
        
        public int GetMovedPosition(int position, int moves)
        {
            int tapeLength = RightBoundary - LeftBoundary + 1;

            int newPosition = position + moves;
            
            // Shift the range to [0, RightBoundary - LeftBoundary]
            // Obtain the new position, then shift back the original range
            newPosition = ((newPosition - LeftBoundary) % tapeLength + tapeLength) % tapeLength + LeftBoundary;
            
            return newPosition;
        }
        
        public bool IsOutOfRange(int position)
        {
            // circular tape will never be out of range
            return false;
        }

        public char Read(int position)
        {
            if (!Tape.TryGetValue(position, out var read))
                read = TapeSymbols.Blank;
            
            return read;
        }

        public bool TryRead(int position , out char? content)
        {
            content = !Tape.TryGetValue(position, out var read) ? TapeSymbols.Blank : read;
            return true;
        }

        public void ScheduleWrite(int position , char content, int machineID, int headID)
        {
            if (IsOutOfRange(position))
                throw new ArgumentOutOfRangeException();
            
            foreach (var op in _writeQueue.Where(op => op.Position == position))
            {
                throw new InvalidOperationException(
                    $"Machine '{machineID}' Head '{headID}' attempted to write '{content}', " + 
                    $"but Machine '{machineID}' Head '{op.HeadID}' has already scheduled a write to this position.");
            }
        
            var writeOperation = new WriteOperation(position, content, machineID, headID);
            _writeQueue.Enqueue(writeOperation);
        }

        public void CommitWrite()
        {
            while (_writeQueue.Count > 0)
            {
                WriteOperation writeOperation = _writeQueue.Dequeue();

                // Remove the key if the content written is a blank symbol
                if (writeOperation.Content == TapeSymbols.Blank)
                    Tape.Remove(writeOperation.Position);
                else
                    Tape[writeOperation.Position] = writeOperation.Content;
            }
        }
        
        public void InitializeContent(string contents)
        {
            if (contents.Length > RightBoundary - LeftBoundary + 1)
                throw new ArgumentOutOfRangeException(
                    "contents must be less than or equal to the tape length.");
            
            int i = 0;
            foreach (var content in contents)
            {
                Tape[i] = content;
                i++;
            }
        }
        
        public void DisplayContent(Dictionary<int, List<Tuple<int, int>>> headPositionsForTape, int tapeIndex)
        {
            int window = 10; // Display 10 cells

            Console.WriteLine($"Tape {tapeIndex}:");

            for (int i = -1; i < window; i++)
            {
                // Display the tape symbol
                if (Tape.TryGetValue(i, out var value))
                {
                    Console.Write($" {value} ");
                    if (value == TapeSymbols.End)
                        break;
                }
                else
                {
                    Console.Write($" {TapeSymbols.Blank} ");
                }

                // Display the head(s) at this position
                if (headPositionsForTape.TryGetValue(i, out var heads))
                {
                    Console.Write($"[{string.Join(",", heads.Select(tuple => $"M{tuple.Item1}H{tuple.Item2}"))}]");
                }

                Console.Write(" "); // Space between cells
            }

            Console.WriteLine(); // New line after displaying the tape
        }
        
        public void UpdateBoundaries(int headPosition)
        {
        }
        
        public string GetContentsAsString()
        {
            string contents = "";

            for (int i = LeftBoundary - 1; i <= RightBoundary + 1; i++)
            {
                if (Tape.TryGetValue(i, out var value))
                    contents += value;
                else
                    contents += TapeSymbols.Blank;
            }

            return contents;
        }
    }
}
