using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Machines.Heads;
using TuringMachine.Backend.Server.Models.Machines.Transitions;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbMachine = TuringMachine.Backend.Server.Database.Entity.MachineStorage.Machine;

using ResponseMachineConfig = TuringMachine.Backend.Server.Models.Machines.MachineConfig;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.DbMachineInteraction
{
    internal class DbMachineInteraction
    {
        public static ServerResponse<IList<ResponseMachineConfig>> GetMachine(string designID , DataContext db)
        {
            List<ResponseMachineConfig> responseMachines = new List<ResponseMachineConfig>();
            foreach (DbMachine dbMachine in db.Machines.Where(machine => machine.DesignID == Guid.Parse(designID)))
            {
                ServerResponse<IList<Head>> getHeadResponse = DbHeadInteraction.GetHead(dbMachine.MachineID.ToString() , db);
                if (getHeadResponse.Status is not SUCCESS)
                    return ServerResponse.StartTracing<IList<ResponseMachineConfig>>(nameof(GetMachine) , BACKEND_ERROR);

                ServerResponse<ICollection<Transition?>> getTransitionResponse = DbTransitionInteraction.GetTransition(dbMachine.MachineID.ToString() , db);
                if (getTransitionResponse.Status is not SUCCESS)
                    return ServerResponse.StartTracing<IList<ResponseMachineConfig>>(nameof(GetMachine) , BACKEND_ERROR);

                responseMachines.Add(
                    new ResponseMachineConfig
                    {
                        Transitions = getTransitionResponse.Result! ,
                        Heads       = getHeadResponse.Result! ,
                    }
                );
            }

            return new ServerResponse<IList<ResponseMachineConfig>>(SUCCESS , responseMachines);
        }
    }
}
