namespace TuringMachineSimulation.Logic.Tapes.TapesUtilities
{
    public class WriteOperation
    {
        public int Position { get; set; }
        public char Content { get; set; }
        public int MachineID { get; set; }
        public int HeadID { get; set; }
        
        public WriteOperation(int position, char content, int machineID, int headID)
        {
            Position = position;
            Content = content;
            MachineID = machineID;
            HeadID = headID;
        }
    }
}