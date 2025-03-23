namespace TuringMachineSimulation.Logic.Tapes.TapesUtilities
{
    public class TapeConfig
    {
        public TapeTypes TapeType { get; set; }
        
        // Ignore if the tape type is infinite
        public int TapeLength { get; set; }
        
        // The string representation of the initial tape content
        public string TapeContent { get; set; }

        public TapeConfig(TapeTypes tapeType, int tapeLength, string tapeContent)
        {
            TapeType = tapeType;
            TapeLength = tapeLength;
            TapeContent = tapeContent;
        }
    }
}