namespace ECS.TuringMachineLib.Tape;

public class InfiniteTape : ITape
{
    private readonly Cell _beginCell = new();
    private readonly Queue<WriteOperation> _writeQueue = new();

    public Cell GetStart()
    {
        return _beginCell;
    }
    
    public bool ScheduleWrite(Cell target, char writeSymbol, int headID)
    {
        foreach (var op in _writeQueue.Where(op => op.Target == target))
        {
            Console.WriteLine($"Error: Head '{headID}' attempted to write '{writeSymbol}', " +
                              $"but Head '{op.HeadID}' has already scheduled a write to this cell.");

            return false;
        }
        
        var writeOperation = new WriteOperation(target, writeSymbol, headID);
        _writeQueue.Enqueue(writeOperation);
        return true;
    }
    
    public Cell GetLeft(Cell currentCell)
    {
        if (currentCell.Left == null)
        {
            Cell newCell = new Cell();
            currentCell.Left = newCell;
            newCell.Right = currentCell;
        }
        
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

    public void DisplayContent(int window = 10, Cell targetCell = null, int currentState = -1)
    {
        Cell currentCell = _beginCell;

        for (int i = 0; i < window / 4; i++)
        {
            currentCell = GetLeft(currentCell);
        }

        for (int i = 0; i < window; i++)
        {
            if (targetCell == currentCell)
            {
                // Highlight the head's position with brackets
                Console.Write($"[{targetCell.Symbol}]");
            }
            else
            {
                // Just display the symbol
                Console.Write($" {currentCell.Symbol} ");
            }
            
            currentCell = GetRight(currentCell);
        }
        
        // Display the current state if provided
        if (currentState >= 0)
        {
            Console.WriteLine();
            Console.WriteLine($"Current State: {currentState}");
        }
    }
}