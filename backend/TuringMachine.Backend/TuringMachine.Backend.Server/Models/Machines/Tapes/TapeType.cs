namespace TuringMachine.Backend.Server.Models.Machines.Tapes
{
    internal enum TapeType : byte
    {
        Infinite ,
        LeftLimited ,
        RightLimited ,
        LeftRightLimited ,
        Circular ,
    }
}