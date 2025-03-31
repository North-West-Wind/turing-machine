namespace ECS.TuringMachineLib;

public class Cell(char symbol = '_')
{
    public char Symbol { get; set; } = symbol;
    public Cell Left { get; set; } = null;
    public Cell Right { get; set; } = null;
};