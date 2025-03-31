namespace ECS.TuringMachineLib.Tape;

public class WriteOperation(Cell target, char writeSymbol, int headID)
{
    public Cell Target { get; set; } = target;
    public char WriteSymbol { get; set; } = writeSymbol;
    
    public int HeadID { get; set; } = headID;
}

public interface ITape
{
    public Cell GetStart();
    public void InitializeInput(string input);
    public bool ScheduleWrite(Cell target, char writeSymbol, int headID);
    public void CommitWrites();
    public char Read(Cell target);
    public Cell GetLeft(Cell currentCell);
    public Cell GetRight(Cell currentCell);
    public void DisplayContent(int window = 10, Cell targetCell = null, int currentState = -1);
}