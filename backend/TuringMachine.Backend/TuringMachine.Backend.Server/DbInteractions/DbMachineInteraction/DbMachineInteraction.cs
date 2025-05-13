using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.MachineDesigns;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;
using Head = TuringMachine.Backend.Server.Models.MachineDesigns.Head;

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
        public static ServerResponse<IList<MachineConfig>> GetMachines(string designID , DataContext db)
        {
            IQueryable<DbMachine> dbMachines       = db.Machines.Where(machine => machine.DesignID == Guid.Parse(designID));
            int                   size             = dbMachines.Count();
            if (size == 0) return ServerResponse.StartTracing<IList<MachineConfig>>(nameof(GetMachines) , NO_SUCH_ITEM);

            MachineConfig[]              responseMachines     = new MachineConfig[size];
            using IEnumerator<DbMachine> dbMachinesEnumerator = dbMachines.GetEnumerator();
            int                          index                = -1;
            while (dbMachinesEnumerator.MoveNext())
            {
                index++;
                DbMachine dbMachine = dbMachinesEnumerator.Current;

                ServerResponse<IList<Head>> getHeadResponse = DbHeadInteraction.GetHeads(dbMachine.MachineID.ToString() , db);
                if (getHeadResponse.Status is not SUCCESS)
                    return getHeadResponse.WithThisTraceInfo<IList<MachineConfig>>(nameof(GetMachines) , BACKEND_ERROR);

                ServerResponse<ICollection<ResponseTransition>> getTransitionResponse = DbTransitionInteraction.GetTransition(dbMachine.MachineID.ToString() , db);
                if (getTransitionResponse.Status is not SUCCESS)
                    return getTransitionResponse.WithThisTraceInfo<IList<MachineConfig>>(nameof(GetMachines) , BACKEND_ERROR);

                responseMachines[index] = new MachineConfig
                {
                    Transitions = getTransitionResponse.Result! ,
                    Heads       = getHeadResponse.Result! ,
                };
            }

            return new ServerResponse<IList<MachineConfig>>(SUCCESS , responseMachines);
        }

        /// <returns>
        ///     Insert a list of machine config when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "TOO_MUCH_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse InsertMachines(string designID , IList<MachineConfig> machines , DataContext db)
        {
            if (machines.Count > byte.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertMachines) , TOO_MUCH_ITEM);

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
                    return insertHeadResponse.WithThisTraceInfo(nameof(InsertMachines) , BACKEND_ERROR);
                
                ServerResponse insertTransitionResponse = DbTransitionInteraction.InsertTransition(machineID , machines[i].Transitions , db);
                if (insertTransitionResponse.Status is not SUCCESS)
                    return insertTransitionResponse.WithThisTraceInfo(nameof(InsertMachines) , BACKEND_ERROR);
            }

            return new ServerResponse(SUCCESS);
        }

        /// <returns>
        ///     Delete a list of machine config when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse DeleteMachines(string designID , DataContext db)
        {
            IQueryable<DbMachine> dbMachines = db.Machines.Where(machine => machine.DesignID == Guid.Parse(designID));
            if (!dbMachines.Any())
                return ServerResponse.StartTracing(nameof(DeleteMachines) , NO_SUCH_ITEM);

            foreach (DbMachine dbMachine in dbMachines)
            {
                ServerResponse deleteTransitionResponse = DbTransitionInteraction.DeleteTransition(dbMachine.MachineID.ToString() , db);
                if (deleteTransitionResponse.Status is not SUCCESS)
                    return deleteTransitionResponse.WithThisTraceInfo(nameof(DeleteMachines) , BACKEND_ERROR);

                ServerResponse deleteHeadResponse = DbHeadInteraction.DeleteHeads(dbMachine.MachineID.ToString() , db);
                if (deleteHeadResponse.Status is not SUCCESS)
                    return deleteHeadResponse.WithThisTraceInfo(nameof(DeleteMachines) , BACKEND_ERROR);

                db.Remove(dbMachine);
            }
            return new ServerResponse(SUCCESS);
        }
    }
}
