using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.MachineDesigns;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbMachine = TuringMachine.Backend.Server.Database.Entity.MachineStorage.Machine;
using DbTransition = TuringMachine.Backend.Server.Database.Entity.MachineStorage.Transition;
using DbTransitionStatement = TuringMachine.Backend.Server.Database.Entity.MachineStorage.TransitionStatement;

using ResponseTransition = TuringMachine.Backend.Server.Models.MachineDesigns.Transition;
using ResponseTransitionStatement = TuringMachine.Backend.Server.Models.MachineDesigns.TransitionStatement;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.DbMachineInteraction
{
    internal class DbMachineInteraction
    {
        /// <returns>
        ///     Return a list of machine config when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<IList<MachineConfig>> GetMachine(string designID , DataContext db)
        {
            List<MachineConfig> responseMachines = new List<MachineConfig>();
            foreach (DbMachine dbMachine in db.Machines.Where(machine => machine.DesignID == Guid.Parse(designID)))
            {
                ServerResponse<IList<Head>> getHeadResponse = DbHeadInteraction.GetHead(dbMachine.MachineID.ToString() , db);
                if (getHeadResponse.Status is not SUCCESS)
                    return getHeadResponse.WithThisTraceInfo<IList<MachineConfig>>(nameof(GetMachine) , BACKEND_ERROR);

                ServerResponse<ICollection<ResponseTransition>> getTransitionResponse = DbTransitionInteraction.GetTransition(dbMachine.MachineID.ToString() , db);
                if (getTransitionResponse.Status is not SUCCESS)
                    return getTransitionResponse.WithThisTraceInfo<IList<MachineConfig>>(nameof(GetMachine) , BACKEND_ERROR);

                responseMachines.Add(
                    new MachineConfig
                    {
                        Transitions = getTransitionResponse.Result! ,
                        Heads       = getHeadResponse.Result! ,
                    }
                );
            }

            if (responseMachines.Count == 0)
                return ServerResponse.StartTracing<IList<MachineConfig>>(nameof(GetMachine) , NO_SUCH_ITEM);

            return new ServerResponse<IList<MachineConfig>>(SUCCESS , responseMachines);
        }
    }
}
