using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TuringMachineSimulation.Logic.Tapes
{
    public enum TapeTypes
    {
        Infinite         , 
        LeftLimited      , 
        RightLimited     ,
        LeftRightLimited ,
        Circular         ,
    }
}
