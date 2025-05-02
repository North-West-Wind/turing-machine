using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.ServerResponses
{
    internal class ServerResponse
    {
        public DateTime Time => DateTime.Now;

        public ResponseStatus Status { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; set; }

        public ServerResponse() { }

        public ServerResponse(ResponseStatus status) { Status = status; }

        public ServerResponse(ResponseStatus status , string description)
        {
            Status      = status;
            Description = description;
        }
    }

    internal class ServerResponse<T> : ServerResponse
    {
        public DateTime Time => DateTime.Now;


        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public T? Data { get; set; }



        public ServerResponse() { }

        public ServerResponse(T data) { Data = data; }

        public ServerResponse(ResponseStatus status) { Status = status; }

        public ServerResponse(ResponseStatus status , T? data)
        {
            Status = status;
            Data   = data;
        }

        public ServerResponse((ResponseStatus Status, T? Data) taskResponse)
        {
            Status = taskResponse.Status;
            Data   = taskResponse.Data;
        }

        public ServerResponse(ResponseStatus status , T? data , string description)
        {
            Status      = status;
            Data        = data;
            Description = description;
        }


        public (ResponseStatus , T?) ToTuple() => (Status , Data);
    }
}
