namespace TuringMachineSimulation.Logic.Tapes
{
    public interface ITape
    {
        public int LeftBoundary { get; internal set; }
        public int RightBoundary { get; internal set; }
        
        public TapeTypes Type { get; }  // Allow UIs to know which tape it is and render it correctly.


        /// <summary> Checks whether the position is out of the tape. </summary>
        /// <returns> True if out of range, False if the cell exist. <br/> Notes: Be careful, the logic is reversed.</returns>
        public bool IsOutOfRange(int position); // Allow UIs to know whether the position is out of the tape.


        /// <summary> Reads a cell on the tape. </summary>
        /// <param name="position"> The position of the cell. Position can be negatives. </param>
        /// <exception cref="ArgumentOutOfRangeException"> Throw when reading out of the tape. </exception>
        public char Read(int position); // Allow UIs to read the content of the tape. Can be used in conjunction with IHead.Position.

        /// <summary> Reads a cell on the tape. </summary>
        /// <param name="position"> The position of the cell. Position can be negatives. </param>
        /// <param name="content"> Returns the read content. Can be null when out of bound. </param>
        /// <returns> Returns true when there is a content in the tape with corresponding position.  </returns>
        public bool TryRead(int position , out char? content);  // Allow UIs to try to read the content of the tape. Can be used in conjunction with IHead.Position.


        /// <summary> Writes a content into a cell on the tape. </summary>
        /// <param name="position"> The position of the cell. Position can be negatives. </param>
        /// <param name="content"> The content that is going to store in the cell. </param>
        /// <param name="machineID"> The machine that is going to write.  </param>
        /// <param name="headID"> The machine head that is going to write.  </param>
        /// <exception cref="ArgumentOutOfRangeException"> Throw when writing out of the tape. </exception>
        /// <exception cref="InvalidOperationException"> Throw when multiple writes happen. </exception>
        internal void ScheduleWrite(int position , char content, int machineID, int headID);   // Do not allow UIs to write directly. Use this method to schedule a write operation.

        /// <summary>
        /// Updates the tape contents by the scheduled write operations.
        /// </summary>
        internal void CommitWrite();
        
        /// <summary> For Heads to know where the new position is </summary>
        /// <param name="position"> The position of the head. Position can be negative. </param>
        /// <param name="moves"> The move steps. Moves can be negative. </param>
        /// <returns> Returns the new position of the head. Can be negative as well </returns>
        public int GetMovedPosition(int position, int moves);

        /// <summary> For Simulator to input the initial content of the tape.
        /// The write will by default start with 0
        /// </summary>
        /// <param name="contents"> The initial content, represented by a string. </param>
        /// <exception cref="ArgumentOutOfRangeException"> Throw when the content length is longer than the length. </exception>
        internal void InitializeContent(string contents);

        /// <summary> For Simulator to visually display the contents with head positions. Not for UI. </summary>
        /// <param name="headPositionsForTape"> A mapping from tape position index to machine and head ID. </param>
        /// <param name="tapeIndex"> The tape ID. </param>
        internal void DisplayContent(Dictionary<int, List<Tuple<int, int>>> headPositionsForTape, int tapeIndex);

        /// <summary> For Simulator to update the tape boundaries based on the new position of the head in infinite tapes.
        /// </br> Note: This boundary doesn't mean the current boundaries for infinite tapes, but only the current content window. </summary>
        /// <param name="headPosition"> The current head position. </param>
        internal void UpdateBoundaries(int headPosition);
        
        /// <summary> For system state to get tape content as string. For UI. </summary>
        /// <returns> A string based tape content. </returns>
        internal string GetContentsAsString();
    }
}
