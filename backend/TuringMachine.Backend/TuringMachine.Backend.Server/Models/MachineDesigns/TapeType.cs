namespace TuringMachine.Backend.Server.Models.MachineDesigns
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