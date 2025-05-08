using System.Numerics;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels
{
    public class MachineBoxLabel
    {
        public Vector2 Start { get; set; }
        public Vector2 Size  { get; set; }
        public int     Color { get; set; }
    }
}
