namespace TuringMachine.Backend.Server.Models.LevelTemplates.Constraints
{
    internal class Constraint
    {
        public short? MinState { get; set; }
        public short? MaxState { get; set; }
        public short? MinTransition { get; set; }
        public short? MaxTransition { get; set; }
        public short? MinHead { get; set; }
        public short? MaxHead { get; set; }
        public short? MinTape { get; set; }
        public short? MaxTape { get; set; }
        
        public bool AllowInfinite { get; set; }
        public bool AllowLeftLimited { get; set; }
        public bool AllowRightLimited { get; set; }
        public bool AllowLeftRightLimited { get; set; }
        public bool AllowCircular { get; set; }
    }
}