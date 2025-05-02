using System.Text.Json.Serialization;

namespace TuringMachine.Backend.Server.Models.Machines.Tapes
{
    [JsonConverter(typeof(JsonStringEnumConverter<TapeType>))]
    internal enum TapeType : byte
    {
        Infinite,
        LeftLimited,
        RightLimited,
        LeftRightLimited,
        Circular,
    }
}
