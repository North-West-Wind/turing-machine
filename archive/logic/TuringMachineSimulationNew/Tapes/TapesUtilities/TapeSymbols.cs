namespace TuringMachineSimulation.Logic.Tapes.TapesUtilities
{
    public static class TapeSymbols
    {
        /// <summary>
        /// Empty content, the default value of the tape <br/> Notes: the tape doesn't actually store it
        /// </summary>
        public const char Blank = '_';
        
        /// <summary>
        /// Start symbol, for left limited tapes
        /// </summary>
        public const char Start = '>';
        
        /// <summary>
        /// End symbol, for right limited tapes
        /// </summary>
        public const char End = '<';
        
        /// <summary>
        /// None symbol, for read/write only heads
        /// </summary>
        public const char None = '/';
    }
}