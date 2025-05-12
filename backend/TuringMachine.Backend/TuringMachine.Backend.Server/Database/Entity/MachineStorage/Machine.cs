namespace TuringMachine.Backend.Server.Database.Entity.MachineStorage
{
    internal class Machine
    {
        public Guid  DesignID     { get; set; }
        public short MachineIndex { get; set; }
        public Guid  MachineID    { get; set; }
        public short StartNode    { get; set; }


        #region Relationship
        public MachineDesign BelongedDesign { get; set; }

        public ICollection<Head>       Heads       { get; set; }
        public ICollection<Transition> Transitions { get; set; }
        #endregion
    }
}