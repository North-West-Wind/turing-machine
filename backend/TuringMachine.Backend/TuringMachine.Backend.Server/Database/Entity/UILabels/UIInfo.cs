using TuringMachine.Backend.Server.Database.Entity.MachineStorage;

namespace TuringMachine.Backend.Server.Database.Entity.UILabels
{
    internal class UIInfo
    {
        public Guid UILabelID { get; set; }
        public Guid DesignID  { get; set; }
        public byte UIIndex   { get; set; }
        public int  Color     { get; set; }


        #region Relationship
        public MachineDesign                    BelongedDesign  { get; set; }

        public ICollection<TransitionLine>      TransitionLines { get; set; }
        public ICollection<HighlightBoxesLabel> HighlighBoxes   { get; set; }
        public ICollection<NodeLabel>           Nodes           { get; set; }
        #endregion
    }
}