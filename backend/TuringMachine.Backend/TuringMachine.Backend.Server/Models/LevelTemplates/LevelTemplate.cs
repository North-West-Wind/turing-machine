using System.Data;
using TuringMachine.Backend.Server.Models.LevelTemplates.TestCases;

namespace TuringMachine.Backend.Server.Models.LevelTemplates
{
    internal class LevelTemplate
    {
        public byte LevelID { get; set; }
        public char[] Title { get; set; }
        public string Description { get; set; }
        
        public byte? ParentID { get; set; }
        public byte[] ChildrenID { get; set; }
        
        public TestCase[] TestCases { get; set; }
        
        public Constraint[] Constraints { get; set; }
        
        public int MinTransitionCount { get; set; }
        public int MinStateCount { get; set; }
        public int MinHeadCount { get; set; }
        public int MinTapeCount { get; set; }
        public int MinOperationCount { get; set; }
        
        public int MaxTransitionCount { get; set; }
        public int MaxStateCount { get; set; }
        public int MaxHeadCount { get; set; }
        public int MaxTapeCount { get; set; }
        public int MaxOperationCount { get; set; }
    }
}