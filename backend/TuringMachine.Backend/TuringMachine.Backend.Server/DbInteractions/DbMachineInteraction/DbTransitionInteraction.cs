using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbTransition = TuringMachine.Backend.Server.Database.Entity.MachineStorage.Transition;
using DbTransitionStatement = TuringMachine.Backend.Server.Database.Entity.MachineStorage.TransitionStatement;

using ResponseTransition = TuringMachine.Backend.Server.Models.Machines.Transitions.Transition;
using ResponseTransitionStatement = TuringMachine.Backend.Server.Models.Machines.Transitions.TransitionStatement;
#endregion


namespace TuringMachine.Backend.Server.DbInteractions.DbMachineInteraction
{
    internal static class DbTransitionInteraction
    {
        /// <returns>
        ///     Return a list of transition when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ICollection<ResponseTransition?>> GetTransition(string machineID , DataContext db)
        {
            IQueryable<DbTransition> dbTransitions       = db.Transitions.Where(transition => transition.MachineID == Guid.Parse(machineID));
            int                      size                = dbTransitions.Count();
            ResponseTransition?[]    responseTransitions = new ResponseTransition?[size];
            foreach (DbTransition dbTransition in dbTransitions)
            {
                if (dbTransition.TransitionIndex >= size)
                    return ServerResponse.StartTracing<ICollection<ResponseTransition?>>(nameof(GetTransition) , BACKEND_ERROR);

                if (responseTransitions[dbTransition.TransitionIndex] is not null)
                    return ServerResponse.StartTracing<ICollection<ResponseTransition?>>(nameof(GetTransition) , BACKEND_ERROR);

                ServerResponse<IList<ResponseTransitionStatement>> getTransitionStatements = GetTransitionStatements(dbTransition.TransitionID.ToString() , db);
                if (getTransitionStatements.Status is not SUCCESS)
                    return ServerResponse.StartTracing<ICollection<ResponseTransition?>>(nameof(GetTransition) , BACKEND_ERROR);

                responseTransitions[dbTransition.TransitionIndex] = new ResponseTransition
                {
                    SourceNodeID = dbTransition.SourceNodeIndex ,
                    TargetNodeID = dbTransition.TargetNodeIndex ,
                    Statements = getTransitionStatements.Result! ,
                };
            }
            return new ServerResponse<ICollection<ResponseTransition?>>(SUCCESS , responseTransitions);
        }

        /// <returns>
        ///     Insert a list of transition when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse InsertTransition(string machineID , IList<ResponseTransition> transitions , DataContext db)
        {
            if (transitions.Count > byte.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertTransition) , BACKEND_ERROR);

            for (byte i = 0; i < transitions.Count; i++)
            {
                DbTransition dbTransition = new DbTransition
                {
                    MachineID = Guid.Parse(machineID) ,
                    TransitionIndex = i ,
                    SourceNodeIndex = transitions[i].SourceNodeID ,
                    TargetNodeIndex = transitions[i].TargetNodeID ,
                };
                db.Transitions.Add(dbTransition);
                ServerResponse insertTransitionStatementsResponse = InsertTransitionStatements(dbTransition.TransitionID.ToString() , transitions[i].Statements , db);
                if (insertTransitionStatementsResponse.Status is not SUCCESS)
                    return insertTransitionStatementsResponse.WithThisTraceInfo(nameof(InsertTransition) , BACKEND_ERROR);
            }

            return new ServerResponse(SUCCESS);
        }

        /// <returns>
        ///     Delete a list of transition when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse DeleteTransition(string machineID , DataContext db)
        {
            foreach (DbTransition transition1 in db.Transitions.Where(transition => transition.MachineID == Guid.Parse(machineID)))
            {
                db.Transitions.Remove(transition1);

                ServerResponse deleteTransitionStatementsResponse = DeleteTransitionStatements(transition1.TransitionID.ToString() , db);
                if (deleteTransitionStatementsResponse.Status is not SUCCESS)
                    return deleteTransitionStatementsResponse.WithThisTraceInfo(nameof(DeleteTransition) , BACKEND_ERROR);
            }
            return new ServerResponse(SUCCESS);
        }

        /// <returns>
        ///     Return a list of transition statement when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<IList<ResponseTransitionStatement>> GetTransitionStatements(string transitionID , DataContext db)
        {
            List<ResponseTransitionStatement> responseTransitionStatements = new List<ResponseTransitionStatement>();
            IQueryable<DbTransitionStatement> dbTransitionStatements = db.TransitionStatements.Where(transitionStatement => transitionStatement.TransitionID == Guid.Parse(transitionID));
            foreach (DbTransitionStatement dbTransitionStatement in dbTransitionStatements)
            {
                if (dbTransitionStatement.Read.Length != 1 && dbTransitionStatement.Write.Length != 1)
                    return ServerResponse.StartTracing<IList<ResponseTransitionStatement>>(nameof(GetTransitionStatements) , BACKEND_ERROR);

                responseTransitionStatements.Add(
                    new ResponseTransitionStatement
                    {
                        TapeID = dbTransitionStatement.StatementIndex ,
                        Read = dbTransitionStatement.Read[0] ,
                        Write = dbTransitionStatement.Write[0] ,
                        Move = dbTransitionStatement.Move ,
                    }
                );
            }
            return new ServerResponse<IList<ResponseTransitionStatement>>(SUCCESS , responseTransitionStatements);
        }

        /// <returns>
        ///     Insert a list of transition statement when "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static ServerResponse InsertTransitionStatements(string transitionID , IList<ResponseTransitionStatement> transitionStatements , DataContext db)
        {
            if (transitionStatements.Count > byte.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertTransitionStatements) , BACKEND_ERROR);

            for (byte i = 0; i < transitionStatements.Count; i++)
                db.TransitionStatements.Add(
                    new DbTransitionStatement
                    {
                        TransitionID   = Guid.Parse(transitionID) ,
                        StatementIndex = i ,
                        Read           = transitionStatements[i].Read.ToString() ,
                        Write          = transitionStatements[i].Write.ToString() ,
                        Move           = transitionStatements[i].Move ,
                    }
                );

            return new ServerResponse(SUCCESS);
        }

        /// <returns>
        ///     Delete a list of transition statement when "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static ServerResponse DeleteTransitionStatements(string transitionID , DataContext db)
        {
            db.TransitionStatements.RemoveRange(
                db.TransitionStatements.Where(transitionStatement => transitionStatement.TransitionID == Guid.Parse(transitionID))
            );
            return new ServerResponse(SUCCESS);
        }
    }
}
