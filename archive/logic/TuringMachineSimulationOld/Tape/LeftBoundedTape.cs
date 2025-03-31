namespace ECS.TuringMachineLib.Tape;

public class LeftBoundedTape : ITape
{
    private readonly Cell _beginCell = new();
    private readonly Queue<WriteOperation> _writeQueue = new();

    public bool ScheduleWrite(Cell target, char writeSymbol, int headID)
    {
        foreach (var op in _writeQueue.Where(op => op.Target == target))
        {
            Console.WriteLine($"Error: Head '{headID}' attempted to write '{headID}', " +
                              $"but Head '{op.HeadID}' has already scheduled a write to this cell.");

            return false;
        }
        
        var writeOperation = new WriteOperation(target, writeSymbol, headID);
        _writeQueue.Enqueue(writeOperation);
        return true;
    }
    
    public Cell GetStart()
    {
        return _beginCell;
    }

    public Cell GetLeft(Cell currentCell)
    {
        return currentCell.Left;
    }

    public Cell GetRight(Cell currentCell)
    {
        if (currentCell.Right == null)
        {
            Cell newCell = new Cell();
            currentCell.Right = newCell;
            newCell.Left = currentCell;
        }
        
        return currentCell.Right;
    }
    
    public void InitializeInput(string input)
    {
        Cell currentCell = _beginCell;
        foreach (char symbol in input)
        {
            currentCell.Symbol = symbol;
            currentCell = GetRight(currentCell);
        }
    }

    public void CommitWrites()
    {
        while (_writeQueue.Count > 0)
        {
            WriteOperation writeOperation = _writeQueue.Dequeue();
            writeOperation.Target.Symbol = writeOperation.WriteSymbol;
        }
    }

    public char Read(Cell targetCell)
    {
        return targetCell.Symbol;
    }

    public void DisplayContent(int window = 5, Cell targetCell = null, int currentState = -1)
    {
        Cell currentCell = _beginCell;

        for (int i = 0; i < window; i++)
        {
            Console.Write(currentCell.Symbol);
            currentCell = GetRight(currentCell);
        }
    }
}