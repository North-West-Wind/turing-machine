using TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels;

namespace TuringMachine.Backend.Server.Database.Entity.Machine
{
    internal class Machine
    {
        public Guid MachineID { get; set; }
        public Guid DesignID  { get; set; }


        #region Relation
        public MachineDesign Design { get; set; }

        public ICollection<Transition> Transitions { get; set; }
        public ICollection<Head>       Heads       { get; set; }

        public MachineLabel Label { get; set; }
        #endregion
    }
}
