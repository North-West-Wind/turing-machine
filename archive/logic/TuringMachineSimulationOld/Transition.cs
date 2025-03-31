namespace ECS.TuringMachineLib;

public class Transition(int srcId, int dstId, char[] readSymbol, char[] writeSymbol, bool[] isMoveRight)
{
    public int SrcID { get; set; } = srcId;
    public int DstID { get; set; } = dstId;
    public char[] ReadSymbol { get; set; } = readSymbol;
    public char[] WriteSymbol { get; set; } = writeSymbol;
    public bool[] IsMoveRight { get; set; } = isMoveRight;
}