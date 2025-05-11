using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines;

namespace TuringMachine.Backend.Server.ServerResponses.ResponseBody
{
    internal class ProgressResponseBody
    {
        public byte                 Level         { get; set; }
        public TuringMachineDesign? MachineDesign { get; set; }
        public DateTime             Time          { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public int Operations { get; set; } = 0;
    }
}
