namespace TuringMachine.Backend.Server.Models.ServerResponses
{
    internal class ServerResponse<T>
    {
        public DateTime Time => DateTime.Now;

        public string? Message { get; set; }

        public T? Data { get; set; }



        public ServerResponse() { }
        public ServerResponse(string message) { Message = message; }
        public ServerResponse(T data) { Data = data; }
        public ServerResponse(string message , T data) { Message = message; Data = data; }
    }
}
