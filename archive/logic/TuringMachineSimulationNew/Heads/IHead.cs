using TuringMachineSimulation.Logic.Tapes;

namespace TuringMachineSimulation.Logic.Heads
{
    public interface IHead
    {
        // Allow UIs to know which head it is and render it correctly.
        public HeadType Type { get; }

        // Leave this public for UI to get contents near the head including left and right.
        public int Position { get; internal set; }
        
        // Leave this public for UI to get the referencing tape
        public int TapeID { get; internal set; }

        /// <summary> Gets the content in current position of the head. </summary>
        /// <returns> Returns the read content. Can be null when out of bound. </returns>
        public char? GetCurrentContent();
        
        /// <summary> Moves the head. No effects to the tape. </summary>
        /// <param name="steps"> Moves this number of steps. Can be negative and zero. </param>
        public void Move(int steps);

        /// <summary> Try to write to content into a cell on the tape </summary>
        /// <param name="content"> The content that is going to store in the cell. </param>
        /// <param name="machineID"> The machine ID. </param>
        /// <param name="headID"> The head ID. </param>
        /// <returns> True if the write operation is successful. False otherwise. </returns>
        public bool TryWrite(char content, int machineID, int headID);

        /// <summary> Check if the head is using the given tape. </summary>
        /// <param name="tape"> The given ITape object. </param>
        /// <returns> True if it is using the given tape. </returns>
        public bool IsUsesTape(ITape tape);
    }
}
