using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.UserInterface;

namespace TuringMachine.Backend.Server.Models.MachineDesigns
{
    internal class MachineDesign
    {
        public string Author  { get; set; }
        public byte?   LevelID { get; set; }

        public TapeInfo                         TapeInfo { get; set; }
        public ICollection<MachineUIConfigPair> Machines { get; set; }


        #region Statistics
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? MaxTransition { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? TransitionCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? StateCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? HeadCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public short? TapeCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? OperationCount { get; set; }
        #endregion


        public static MachineDesign CreateTemplate(string author)
        {
            MachineDesign template = new MachineDesign
            {
                Author = author ,
                TapeInfo = new TapeInfo
                {
                    InputTape = 0 ,
                    OutputTape = 1 ,
                } ,
                Machines = new List<MachineUIConfigPair>
                {
                    new MachineUIConfigPair
                    {
                        MachineConfig = new MachineConfig
                        {
                            StartNode = 0 ,
                            Heads = new List<Head>(0) ,
                            Transitions = new List<Transition>(0) ,
                        } ,
                        UILabel = new UILabel
                        {
                            Color = 0 ,
                            HighlightBoxes = new List<HighlightBox>(0) ,
                            Nodes = new List<Node>(0) ,
                            TextLabels = new List<TextLabel>(0),
                            TransitionLines = new List<TransitionLine>(0) ,
                        } ,
                    } ,
                } ,
            };

            return template;
        }
    }
}