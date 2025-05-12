using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.MachineDesigns;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbMachine = TuringMachine.Backend.Server.Database.Entity.MachineStorage.Machine;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.DbMachineInteraction
{
    internal class DbMachineInteraction
    {
        public static ServerResponse<IList<MachineConfig>> GetMachine(string designID , DataContext db)
        {
            List<MachineConfig> responseMachines = new List<MachineConfig>();
            foreach (DbMachine dbMachine in db.Machines.Where(machine => machine.DesignID == Guid.Parse(designID)))
            {
                ServerResponse<IList<Head>> getHeadResponse = DbHeadInteraction.GetHead(dbMachine.MachineID.ToString() , db);
                if (getHeadResponse.Status is not SUCCESS)
                    return ServerResponse.StartTracing<IList<MachineConfig>>(nameof(GetMachine) , BACKEND_ERROR);

                ServerResponse<ICollection<Transition?>> getTransitionResponse = DbTransitionInteraction.GetTransition(dbMachine.MachineID.ToString() , db);
                if (getTransitionResponse.Status is not SUCCESS)
                    return ServerResponse.StartTracing<IList<MachineConfig>>(nameof(GetMachine) , BACKEND_ERROR);

                responseMachines.Add(
                    new MachineConfig
                    {
                        Transitions = getTransitionResponse.Result! ,
                        Heads       = getHeadResponse.Result! ,
                    }
                );
            }

            return new ServerResponse<IList<MachineConfig>>(SUCCESS , responseMachines);
        }
    }
}
