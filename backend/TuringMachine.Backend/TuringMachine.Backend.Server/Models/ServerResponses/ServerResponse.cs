namespace TuringMachine.Backend.Server.Models.ServerResponses
{
    public class ServerResponse
    {
        public DateTime Time => DateTime.Now;

        public string? Message { get; set; }

        public object? Data { get; set; }



        public ServerResponse() { }
        public ServerResponse(string message) { Message = message; }
        public ServerResponse(object data) { Data = data; }
        public ServerResponse(string message , object data) { Message = message; Data = data; }
    }
}
