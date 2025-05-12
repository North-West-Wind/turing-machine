using TuringMachine.Backend.Server.Models.Machine.Tapes;
using TuringMachine.Backend.Server.Models.Machine.Transitions;

namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class MachineDesign
    {
        public Guid Author { get; set; }
        public byte LevelID { get; set; }
        
        public int? TransitionCount { get; set; }
        public short? StateCount { get; set; }
        public short? HeadCount { get; set; }
        public short? TapeCount { get; set; }
        public int? OperationCount { get; set; }
        
        public TapeInfo TapeInfo { get; set; }
        
        public MachineDesign[] Machines { get; set; }
    }
}