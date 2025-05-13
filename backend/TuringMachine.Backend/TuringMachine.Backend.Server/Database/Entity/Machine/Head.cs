namespace TuringMachine.Backend.Server.Database.Entity.Machine
{
    internal class Head
    {
        public Guid  MachineID          { get; set; }
        public bool  IsReadable         { get; set; }
        public bool  IsWritable         { get; set; }
        public byte  TapeReferenceIndex { get; set; }
        public short Position           { get; set; }
        public byte  HeadIndex          { get; set; }

        #region Relationship
        public Machine Machine { get; set; }
        #endregion
    }
}
