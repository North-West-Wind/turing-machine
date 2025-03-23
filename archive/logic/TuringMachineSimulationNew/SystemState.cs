namespace TuringMachineSimulation.Logic
{
    public class SystemState
    {
        // Tapes are shared globally, so track their contents and boundaries
        public List<TapeState> Tapes { get; } = new List<TapeState>();

        // Machines may be deleted or halted, so use a nullable list
        public List<MachineState?> Machines { get; } = new List<MachineState?>();

        /// <summary>
        /// Display the system state for debugging purpose. Not for UI. 
        /// </summary>
        public void DebugPrint()
        {
            Console.WriteLine("======System state======");

            // Tapes section
            Console.WriteLine("Tapes:");
            for (int i = 0; i < Tapes.Count; i++)
            {
                if (Tapes[i] != null)
                {
                    Console.WriteLine($"Tape {Tapes[i].ID} Content: {Tapes[i].Content}");
                    Console.WriteLine($"Current Window: [{Tapes[i].LeftBoundary}, {Tapes[i].RightBoundary}]");
                }
                else
                {
                    Console.WriteLine($"Tape {i} Content: null");
                }
            }

            // Machines section
            Console.WriteLine("Machines:");
            for (int i = 0; i < Machines.Count; i++)
            {
                if (Machines[i] != null)
                {
                    if (Machines[i].IsHalted)
                    {
                        Console.WriteLine($"Machine {Machines[i].ID}: [Halted]");
                    }
                    else
                    {
                        Console.WriteLine($"Machine {Machines[i].ID}: State={Machines[i].CurrentState}");
                    }

                    for (int j = 0; j < Machines[i].Heads.Count; j++)
                    {
                        Console.WriteLine($"  Head {j}: Tape {Machines[i].Heads[j].TapeID} @ Position {Machines[i].Heads[j].Position}");
                    }
                }
                else
                {
                    Console.WriteLine($"Machine {i}: [Deleted]");
                }
            }
        }
    }

    // Tape state: Content, left/right boundaries, and symbols (e.g., "_", ">", "<")
    public class TapeState
    {
        public int ID { get; set; }
        public string Content { get; set; } = "";
        public int LeftBoundary { get; set; }
        public int RightBoundary { get; set; }
    }

    // Machine state: Current state, heads (with tape references), and status
    public class MachineState
    {
        public int ID { get; set; }
        public int CurrentState { get; set; } = -1;
        public List<HeadState> Heads { get; } = new List<HeadState>();
        
        public bool IsHalted { get; set; }
    }

    // Head state: Position on its associated tape
    public class HeadState
    {
        public int TapeID { get; set; } // Which tape this head is on
        public int Position { get; set; }
    }
}