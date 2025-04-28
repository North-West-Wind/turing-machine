using ECS.TuringMachineLib.Tape;

namespace ECS.TuringMachineLib.Head;

public class ReadWriteHead(int headId, ITape tape) : IHead
{
    public Cell Head { get; set; } = tape.GetStart();
    public ITape CurrentTape { get; set; } = tape;
    private int HeadID { get; set; } = headId;

    public void MoveRight()
    {
        Head = CurrentTape.GetRight(Head);
    }

    public void MoveLeft()
    {
        Head = CurrentTape.GetLeft(Head);
    }

    public bool TryWrite(char writeSymbol)
    {
        if (Head != null) return CurrentTape.ScheduleWrite(Head, writeSymbol, HeadID);
        
        Console.WriteLine("Error: Write out of bound");
        return false;
    }
    
    public char TryRead()
    {
        return CurrentTape.Read(Head);
    }

    public Cell GetHeadCell()
    {
        return Head;
    }
}