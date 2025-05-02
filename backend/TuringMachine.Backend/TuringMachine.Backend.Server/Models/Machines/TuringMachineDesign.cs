using TuringMachine.Backend.Server.Models.Machines.Tapes;

namespace TuringMachine.Backend.Server.Models.Machines
{
    internal class TuringMachineDesign
    {
        public ICollection<Tape>          Tapes    { get; set; }
        public ICollection<TuringMachine> Machines { get; set; }    
    }
}
