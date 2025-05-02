namespace TuringMachine.Backend.Server.ServerResponses.ResponseBody
{
    internal class SimplifiedLevelResponseBody
    {
        public byte   LevelID     { get; set; }
        public string Title       { get; set; }
        public string Description { get; set; }
        public byte[] Parent      { get; set; }
    }
}
