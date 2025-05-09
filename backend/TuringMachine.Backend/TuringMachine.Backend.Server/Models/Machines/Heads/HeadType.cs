using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines.Tapes;

namespace TuringMachine.Backend.Server.Models.Machines.Heads
{
    [Flags]
    [JsonConverter(typeof(JsonStringEnumConverter<HeadType>))]
    internal enum HeadType
    {
        Read  = 1 ,
        Write = 2 ,
        ReadWrite = 3,
    }
}
