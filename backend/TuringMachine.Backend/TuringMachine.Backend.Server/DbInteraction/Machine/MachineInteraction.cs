using System.Numerics;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.DbInteraction.UiLabels;
using TuringMachine.Backend.Server.Models.Machines.Heads;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

#region Type Alias
// @formatter:off
using DbTuringMachineDesign = TuringMachine.Backend.Server.Database.Entity.Machine.MachineDesign;
using DbTuringMachineTape = TuringMachine.Backend.Server.Database.Entity.Machine.Tape;
using DbTuringMachine = TuringMachine.Backend.Server.Database.Entity.Machine.Machine;
using DbTransition = TuringMachine.Backend.Server.Database.Entity.Machine.Transition;
using DbTransitionStatement = TuringMachine.Backend.Server.Database.Entity.Machine.TransitionStatement;
using DbTuringMachineHead = TuringMachine.Backend.Server.Database.Entity.Machine.Head;
using DbTransitionLinePathInteraction = TuringMachine.Backend.Server.DbInteraction.UiLabels.TransitionLinePathInteraction;

using ResponseTuringMachineDesign = TuringMachine.Backend.Server.Models.Machines.TuringMachineDesign;
using ResponseTuringMachineTape = TuringMachine.Backend.Server.Models.Machines.Tapes.Tape;
using ResponseTuringMachine = TuringMachine.Backend.Server.Models.Machines.TuringMachine;
using ResponseTransition = TuringMachine.Backend.Server.Models.Machines.Transitions.Transition;
using ResponseTransitionStatement = TuringMachine.Backend.Server.Models.Machines.Transitions.TransitionStatement;
using ResponseTuringMachineHead = TuringMachine.Backend.Server.Models.Machines.Heads.Head;
// @formatter:on
#endregion


namespace TuringMachine.Backend.Server.DbInteraction.Machine
{
    internal static class MachineInteraction
    {
        /// <returns>
        ///     Returns a turing machine design when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "MACHINE_NOT_FOUND", "DUPLICATED_MACHINE", "DUPLICATED_MACHINE_LABEL" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ResponseTuringMachineDesign> GetTuringMachineDesign(string designID , DataContext db)
        {
// @formatter:off
            using IEnumerator<DbTuringMachineDesign> designs = db.MachineDesigns.Where(design => design.DesignID.ToString() == designID)
                                                                                .Include(design => design.Tapes)
                                                                                .Include(design => design.Machines).ThenInclude(machine => machine.Transitions).ThenInclude(transition => transition.Statements)
                                                                                .Include(design => design.Machines).ThenInclude(machine => machine.Heads)
                                                                                .GetEnumerator();

            if (!designs.MoveNext()) return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.MACHINE_NOT_FOUND );             
            DbTuringMachineDesign dbDesign = designs.Current;
            if ( designs.MoveNext()) return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.DUPLICATED_MACHINE); 
// @formatter:on

            ResponseTuringMachineTape[] responseTapes = new ResponseTuringMachineTape[dbDesign.Tapes.Count];
            foreach (DbTuringMachineTape dbTape in dbDesign.Tapes)
                responseTapes[dbTape.TapeIndex] = new ResponseTuringMachineTape { Type = dbTape.TapeType , Values = dbTape.TapeValues , IsInput = dbTape.IsInput , IsOutput = dbTape.IsOutput };

            List<ResponseTuringMachine> responseTuringMachines = new List<ResponseTuringMachine>(dbDesign.Machines.Count);
            foreach (DbTuringMachine dbMachine in dbDesign.Machines)
            {
                ResponseStatus status;

                (status, IList<ResponseTuringMachineHead>? responseMachineHeads) = GetMachineHead(dbMachine.MachineID.ToString() , db).ToTuple();
                if (status != ResponseStatus.SUCCESS)
                    return new ServerResponse<ResponseTuringMachineDesign>(status);

                (status , ICollection<ResponseTransition>? transitions) = GetTuringMachineTransitions(dbMachine.MachineID.ToString() , db).ToTuple().ToTuple();
                if (status != ResponseStatus.SUCCESS)
                    return new ServerResponse<ResponseTuringMachineDesign>(status);

                
                ResponseTuringMachine responseTuringMachine = new ResponseTuringMachine { Transitions = transitions! , Heads = responseMachineHeads! , StartNode = dbMachine.StartNode };
                switch (MachineLabelInteraction.GetMachineLabel(dbMachine.MachineID.ToString() , db).ToTuple())
                {
                    case (ResponseStatus.SUCCESS , { } label):
                        responseTuringMachine.Label = label;
                        break;

                    case (ResponseStatus.MACHINE_NOT_FOUND , _):
                        responseTuringMachine.Label = null;
                        break;

                    case (ResponseStatus.BACKEND_ERROR , _):            return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.BACKEND_ERROR);
                    case (ResponseStatus.DUPLICATED_MACHINE_LABEL , _): return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.DUPLICATED_MACHINE_LABEL);
                }

                responseTuringMachines.Add(responseTuringMachine);
            }
            return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.SUCCESS , new ResponseTuringMachineDesign { Tapes = responseTapes , Machines = responseTuringMachines });
        }

        /// <returns>
        ///     When successfully inserted a turing machine design, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse<string>> InsertTuringMachineDesignAsync(ResponseTuringMachineDesign design , DataContext db)
        {
            DbTuringMachineDesign dbDesign = new DbTuringMachineDesign
            {
                DesignID = Guid.NewGuid() ,
            };
            string designID = dbDesign.DesignID.ToString();
            db.MachineDesigns.Add(dbDesign);

            ServerResponse response = await InsertTuringMachineTapesAsync(design.Tapes , designID , db);
            if (response.Status is not ResponseStatus.SUCCESS)
                return new ServerResponse<string>(response.Status);

            foreach (ResponseTuringMachine machine in design.Machines)
            {
                response = await InsertTuringMachineAsync(machine , designID , db);
                if (response.Status is not ResponseStatus.SUCCESS)
                    return new ServerResponse<string>(response.Status);
            }

            await db.SaveChangesAsync();
            return new ServerResponse<string>(ResponseStatus.SUCCESS , designID);
        }

        #region Helper Functions
        #region Get Turing Machine Design
        // TODO: Extract some of the code in GetTuringMachine() function as a helper functions to enhance readability.


        /// <returns>
        ///     Returns a list of transition (for a particular machine) when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "MACHINE_NOT_FOUND", "DUPLICATED_MACHINE", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        private static ServerResponse<ICollection<ResponseTransition>> GetTuringMachineTransitions(string machineID , DataContext db)
        {
// @formatter:off
            using IEnumerator<DbTuringMachine> machines = db.Machines.Where(machine => machine.MachineID == Guid.Parse(machineID))
                                                                     .Include(machine => machine.Transitions).ThenInclude(transition => transition.Statements)
                                                                     .GetEnumerator();
// @formatter:on

            if (!machines.MoveNext()) return new ServerResponse<ICollection<ResponseTransition>>(ResponseStatus.MACHINE_NOT_FOUND);
            ICollection<DbTransition> dbTransitions = machines.Current.Transitions;
            if (machines.MoveNext()) return new ServerResponse<ICollection<ResponseTransition>>(ResponseStatus.DUPLICATED_MACHINE);

            List<ResponseTransition> responseTransitions = new List<ResponseTransition>(dbTransitions.Count);
            foreach (DbTransition dbTransition in dbTransitions)
            {
                ResponseTransitionStatement[] responseTransitionStatements = new ResponseTransitionStatement[dbTransition.Statements.Count];
                foreach (DbTransitionStatement dbTransitionStatement in dbTransition.Statements)
                    responseTransitionStatements[dbTransitionStatement.StatementIndex] = new ResponseTransitionStatement
                    {
                        Read = dbTransitionStatement.Read ,
                        Write = dbTransitionStatement.Write ,
                        Move = dbTransitionStatement.Move ,
                    };

                (ResponseStatus status, IList<Vector2>? paths) = DbTransitionLinePathInteraction.GetTransitionLinePath(dbTransition.TransitionID.ToString() , db).ToTuple();
                if (status != ResponseStatus.SUCCESS)
                    return new ServerResponse<ICollection<ResponseTransition>>(status);

                responseTransitions.Add(
                    new ResponseTransition
                    {
                        Source = dbTransition.Source ,
                        Target = dbTransition.Target ,
                        Statements = responseTransitionStatements ,
                        TransitionLineSteps = paths ,
                    }
                );
            }
            return new ServerResponse<ICollection<ResponseTransition>>(ResponseStatus.SUCCESS , responseTransitions);
        }

        /// <returns>
        ///     Returns a list of machine head (for a particular machine) when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        private static ServerResponse<IList<ResponseTuringMachineHead>> GetMachineHead(string machineID , DataContext db)
        {
            IQueryable<DbTuringMachineHead> dbMachineHeads = db.Heads.Where(head => head.MachineID.ToString() == machineID);

            ResponseTuringMachineHead[] responseMachineHeads = new ResponseTuringMachineHead[dbMachineHeads.Count()];
            foreach (DbTuringMachineHead dbMachineHead in db.Heads.Where(head => head.MachineID.ToString() == machineID))
            {
// @formatter:off
                HeadType headType;
                switch (dbMachineHead.IsReadable, dbMachineHead.IsWritable)
                {
                    case (true  , false): headType = HeadType.Read     ; break;
                    case (false , true ): headType = HeadType.Write    ; break;
                    case (true  , true ): headType = HeadType.ReadWrite; break;

                    default: return new ServerResponse<IList<ResponseTuringMachineHead>>(ResponseStatus.BACKEND_ERROR);
                }
// @formatter:on

                responseMachineHeads[dbMachineHead.HeadIndex] = new ResponseTuringMachineHead
                {
                    Type     = headType ,
                    Position = dbMachineHead.Position ,
                    Tape     = dbMachineHead.TapeReferenceIndex ,
                };
            }
            return new ServerResponse<IList<ResponseTuringMachineHead>>(ResponseStatus.SUCCESS , responseMachineHeads);
        }

        /// <returns>
        ///     Returns a list of transition (for a particular machine) when "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static ServerResponse<ICollection<ResponseTuringMachineTape>> GetTapes(string designID , DataContext db)
        {
            IQueryable<DbTuringMachineTape> dbTapes = db.Tapes.Where(tape => tape.DesignID.ToString() == designID);
            
            List<ResponseTuringMachineTape> responseTapes = new List<ResponseTuringMachineTape>();
            foreach (DbTuringMachineTape dbTape in dbTapes)
                responseTapes.Add(new ResponseTuringMachineTape
                {
                    Type     = dbTape.TapeType ,
                    Values   = dbTape.TapeValues ,
                    IsInput  = dbTape.IsInput ,
                    IsOutput = dbTape.IsOutput ,
                });

            return new ServerResponse<ICollection<ResponseTuringMachineTape>>(ResponseStatus.SUCCESS , responseTapes);
        }
        #endregion

        #region Insert Turing Machine Design
        /// <returns>
        ///     When successfully inserted a list of turing machine tapes, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        private static async Task<ServerResponse> InsertTuringMachineTapesAsync(IList<ResponseTuringMachineTape> tapes , string designID , DataContext db)  // TODO: clear changes when failure, change BACKEND_ERROR to FAILURE when cleared.
        {
            if (tapes.Count == 0)
                return new ServerResponse(ResponseStatus.SUCCESS);

// @formatter:off
            for (byte i = 0; i < tapes.Count; i++)
                db.Tapes.Add(
                    new DbTuringMachineTape
                    {
                        TapeID     = Guid.NewGuid()     ,
                        DesignID   = new Guid(designID) ,
                        TapeIndex  = i                  ,
                        TapeType   = tapes[i].Type      ,
                        TapeValues = tapes[i].Values    ,
                        IsInput    = tapes[i].IsInput   ,
                        IsOutput   = tapes[i].IsOutput  ,
                    }
                );

            int changedEntries = await db.SaveChangesAsync();
            return changedEntries == tapes.Count ? new ServerResponse(ResponseStatus.SUCCESS)
                                                 : new ServerResponse(ResponseStatus.BACKEND_ERROR);
// @formatter:on
        }

        /// <returns>
        ///     When successfully inserted a turing machine, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static async Task<ServerResponse> InsertTuringMachineAsync(ResponseTuringMachine machine , string designID , DataContext db)  // TODO: clear changes when failure, change BACKEND_ERROR to FAILURE when cleared.
        {
            ServerResponse response;

            DbTuringMachine dbMachine = new DbTuringMachine
            {
                MachineID = Guid.NewGuid() ,
                DesignID = Guid.Parse(designID) ,
                StartNode = machine.StartNode ,
            };
            string machineID = dbMachine.MachineID.ToString();
            db.Machines.Add(dbMachine);

            response = await InsertTuringMachineHeadAsync(machine.Heads , machineID , db);
            if (response.Status is not ResponseStatus.SUCCESS)
                return response;

            foreach (ResponseTransition transition in machine.Transitions)
            {
                response = await InsertTransitionAsync(transition , machineID , db);
                if (response.Status is not ResponseStatus.SUCCESS)
                    return response;
            }

            if (machine.Label is not null)
            {
                response = await MachineLabelInteraction.InsertMachineLabelAsync(machine.Label , machineID , db);
                if (response.Status is not ResponseStatus.SUCCESS)
                    return response;
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully inserted a list of turing machine heads, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        private static async Task<ServerResponse> InsertTuringMachineHeadAsync(IList<ResponseTuringMachineHead> head , string machineID , DataContext db)  // TODO: clear changes when failure, change BACKEND_ERROR to FAILURE when cleared.
        {
            if (head.Count == 0)
                return new ServerResponse(ResponseStatus.SUCCESS);

            for (byte i = 0; i < head.Count; i++)
                db.Heads.Add(
                    new DbTuringMachineHead
                    {
                        MachineID          = Guid.Parse(machineID) ,
                        IsReadable         = head[i].Type == HeadType.Read  || head[i].Type == HeadType.ReadWrite ,
                        IsWritable         = head[i].Type == HeadType.Write || head[i].Type == HeadType.ReadWrite ,
                        TapeReferenceIndex = head[i].Tape ,
                        Position           = head[i].Position ,
                        HeadIndex          = i ,
                    }
                );

            int changedEntries = await db.SaveChangesAsync();
            return changedEntries == head.Count ? new ServerResponse(ResponseStatus.SUCCESS)
                                                : new ServerResponse(ResponseStatus.BACKEND_ERROR);
        }
        
        /// <returns>
        ///     When successfully inserted a transition, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        private static async Task<ServerResponse> InsertTransitionAsync(ResponseTransition transition , string machineID , DataContext db)
        {
            DbTransition dbTransition = new DbTransition
            {
                TransitionID = Guid.NewGuid() ,
                MachineID = Guid.Parse(machineID) ,
                Source = transition.Source ,
                Target = transition.Target ,
            };
            db.Transition.Add(dbTransition);

            for (byte i = 0; i < transition.Statements.Count; i++)
                db.TransitionStatements.Add(
                    new DbTransitionStatement
                    {
                        TransitionID   = dbTransition.TransitionID ,
                        StatementIndex = i ,
                        Read           = transition.Statements[i].Read ,
                        Write          = transition.Statements[i].Write ,
                        Move           = transition.Statements[i].Move ,
                    }
                );

            ServerResponse response = DbTransitionLinePathInteraction.InsertTransitionLinePath(dbTransition.TransitionID.ToString() , transition.TransitionLineSteps , db);
            if (response.Status is not ResponseStatus.SUCCESS)
                return response;

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        #endregion
        #endregion
    }
}
