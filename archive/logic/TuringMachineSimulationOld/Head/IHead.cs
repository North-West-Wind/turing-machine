namespace ECS.TuringMachineLib.Head;

public interface IHead
{
    public char TryRead();
    public bool TryWrite(char writeSymbol);
    public void MoveRight();
    public void MoveLeft();
    public Cell GetHeadCell();
}