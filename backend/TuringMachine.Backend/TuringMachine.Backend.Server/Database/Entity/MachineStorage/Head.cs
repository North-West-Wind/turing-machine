namespace TuringMachine.Backend.Server.Database.Entity.MachineStorage
{
    internal class Head
    {
        public Guid  MachineID   { get; set; }
        public short TapeID      { get; set; }
        public bool  IsReadable  { get; set; }
        public bool  IsWriteable { get; set; }
        public int   Position    { get; set; }


        #region Relationship
        public Machine BelongedMachine { get; set; }
        #endregion
    }
}