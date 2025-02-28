namespace TuringMachine.Backend.Server.Model.ServerResponses
{
    public class ServerResponse
    {
        public DateTime Time => DateTime.Now;

        public string? Message { get; set; }



        public ServerResponse() { }
        public ServerResponse(string message) { Message = message; }
    }
}
