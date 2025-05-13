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
    internal static class DbMachineInteraction
    {
        /// <returns>
        ///     Return a list of machine config when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ICollection<MachineConfig>> GetMachine(string designID , DataContext db)
        {
            List<MachineConfig> responseMachines = new List<MachineConfig>();
            foreach (DbMachine dbMachine in db.Machines.Where(machine => machine.DesignID == Guid.Parse(designID)))
            {
                ServerResponse<IList<Head>> getHeadResponse = DbHeadInteraction.GetHead(dbMachine.MachineID.ToString() , db);
                if (getHeadResponse.Status is not SUCCESS)
                    return getHeadResponse.WithThisTraceInfo<ICollection<MachineConfig>>(nameof(GetMachine) , BACKEND_ERROR);

                ServerResponse<ICollection<ResponseTransition>> getTransitionResponse = DbTransitionInteraction.GetTransition(dbMachine.MachineID.ToString() , db);
                if (getTransitionResponse.Status is not SUCCESS)
                    return getTransitionResponse.WithThisTraceInfo<ICollection<MachineConfig>>(nameof(GetMachine) , BACKEND_ERROR);

                responseMachines.Add(
                    new MachineConfig
                    {
                        Transitions = getTransitionResponse.Result! ,
                        Heads       = getHeadResponse.Result! ,
                    }
                );
            }

            if (responseMachines.Count == 0)
                return ServerResponse.StartTracing<ICollection<MachineConfig>>(nameof(GetMachine) , NO_SUCH_ITEM);

            return new ServerResponse<ICollection<MachineConfig>>(SUCCESS , responseMachines);
        }


        public static ServerResponse InsertMachine(string designID , IList<MachineConfig> machines , DataContext db)
        {
            if (machines.Count > byte.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertMachine) , BACKEND_ERROR);

            for (short i = 0; i < machines.Count; i++)
            {
                DbMachine dbMachine = new DbMachine
                {
                    DesignID     = Guid.Parse(designID) ,
                    MachineIndex = i ,
                    MachineID    = Guid.NewGuid() ,
                    StartNode    = machines[i].StartNode ,
                };
                db.Machines.Add(dbMachine);

                string machineID = dbMachine.MachineID.ToString();

                ServerResponse insertHeadResponse = DbHeadInteraction.InsertHeads(machineID , machines[i].Heads , db);
                if (insertHeadResponse.Status is not SUCCESS)
                    return insertHeadResponse.WithThisTraceInfo(nameof(InsertMachine) , BACKEND_ERROR);
                
                ServerResponse insertTransitionResponse = DbTransitionInteraction.InsertTransition(machineID , machines[i].Transitions , db);
                if (insertTransitionResponse.Status is not SUCCESS)
                    return insertTransitionResponse.WithThisTraceInfo(nameof(InsertMachine) , BACKEND_ERROR);
            }

            return new ServerResponse(SUCCESS);
        }


        public static ServerResponse DeleteMachine(string designID , DataContext db)
        {
            IQueryable<DbMachine> dbMachines = db.Machines.Where(machine => machine.DesignID == Guid.Parse(designID));
            if (!dbMachines.Any())
                return ServerResponse.StartTracing(nameof(DeleteMachine) , NO_SUCH_ITEM);

            foreach (DbMachine dbMachine in dbMachines)
            {
                ServerResponse deleteTransitionResponse = DbTransitionInteraction.DeleteTransition(dbMachine.MachineID.ToString() , db);
                if (deleteTransitionResponse.Status is not SUCCESS)
                    return deleteTransitionResponse.WithThisTraceInfo(nameof(DeleteMachine) , BACKEND_ERROR);

                ServerResponse deleteHeadResponse = DbHeadInteraction.DeleteHead(dbMachine.MachineID.ToString() , db);
                if (deleteHeadResponse.Status is not SUCCESS)
                    return deleteHeadResponse.WithThisTraceInfo(nameof(DeleteMachine) , BACKEND_ERROR);

                db.Remove(dbMachine);
            }
            return new ServerResponse(SUCCESS);
        }
    }
}
