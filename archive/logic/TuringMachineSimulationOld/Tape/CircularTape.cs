namespace ECS.TuringMachineLib.Tape;

public class CircularTape : ITape
{
    private Cell _beginCell = new();
    private readonly Queue<WriteOperation> _writeQueue = new();
    private int Length = 1;

    public CircularTape()
    {
        _beginCell.Left = _beginCell;
        _beginCell.Right = _beginCell;
    }

    private void ExtendLength(int length)
    {
        Length += length;
        for (int i = 0; i < length; i++)
        {
            Cell newCell = new Cell();
            Cell rightEndCell = _beginCell.Left;
        
            rightEndCell.Right = newCell;
            _beginCell.Left = newCell;
            newCell.Right = _beginCell;
            newCell.Left = rightEndCell;

            _beginCell = newCell;
        }
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
        return currentCell.Right;
    }
    
    public void InitializeInput(string input)
    {
        if (input.Length > Length)
        {
            ExtendLength(input.Length);
        }
        
        Cell currentCell = _beginCell;
        foreach (char symbol in input)
        {
            currentCell.Symbol = symbol;
            currentCell = GetRight(currentCell);
        }
    }

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
    
    public void DisplayContent(int window = 10, Cell targetCell = null, int currentState = -1)
    {
        Cell currentCell = _beginCell;

        for (int i = 0; i < window / 2; i++)
        {
            currentCell = GetLeft(currentCell);
        }

        for (int i = 0; i < window; i++)
        {
            Console.Write(currentCell.Symbol);
            currentCell = GetRight(currentCell);
        }
    }
}