using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.ServerResponses.ResponseBody
{
    internal class RankingResponseBody
    {
        public RankingInfo Transitions { get; set; }
        public RankingInfo States      { get; set; }
        public RankingInfo Heads       { get; set; }
        public RankingInfo Tapes       { get; set; }
        public RankingInfo Operations  { get; set; }
    }
}
