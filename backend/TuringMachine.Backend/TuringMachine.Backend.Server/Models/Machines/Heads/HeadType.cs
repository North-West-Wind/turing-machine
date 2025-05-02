namespace TuringMachine.Backend.Server.Models.Machines.Heads
{
    [Flags]
    internal enum HeadType
    {
        Read  = 1 ,
        Write = 2 ,
        ReadWrite = 3,
    }
}
