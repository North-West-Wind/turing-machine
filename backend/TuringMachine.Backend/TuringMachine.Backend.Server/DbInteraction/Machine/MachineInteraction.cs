﻿using System.Numerics;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.DbInteraction.UiLabels;
using TuringMachine.Backend.Server.Models.Machines.Heads;
using TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels;
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
using System.Collections.Generic;
// @formatter:on
#endregion


namespace TuringMachine.Backend.Server.DbInteraction.Machine
{
    internal static class MachineInteraction
    {
        /// <returns>
        ///     Returns a turing machine design when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "DESIGN_NOT_FOUND", "DUPLICATED_DESIGN" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ResponseTuringMachineDesign> GetTuringMachineDesign(string designID , DataContext db)
        {
            ResponseStatus status;
            /*  Logic:
             *  1. Get the design from the database.
             *  2. Get the tapes associated to the design.
             *  3. Get the machines associated to the design by the following logic:
             *      a. Get machine heads associated to the machine.
             *      b. Get transitions associated to the machine.
             *      d. Get the machine label associated to the machine by the follow logic:
             *          If the machine has label => assign label to the machine.
             *          Otherwise,               => set label to null.
             */

            // @formatter:off
            using IEnumerator<DbTuringMachineDesign> designs = db.MachineDesigns.Where(design => design.DesignID.ToString() == designID)
                                                                                .Include(design => design.Tapes)
                                                                                .Include(design => design.Machines).ThenInclude(machine => machine.Transitions).ThenInclude(transition => transition.Statements)
                                                                                .Include(design => design.Machines).ThenInclude(machine => machine.Heads)
                                                                                .GetEnumerator();

            if (!designs.MoveNext()) return ServerResponse.StartTracing<ResponseTuringMachineDesign>(nameof(GetTuringMachineDesign) , ResponseStatus.DESIGN_NOT_FOUND);
            DbTuringMachineDesign dbDesign = designs.Current;
            if ( designs.MoveNext()) return ServerResponse.StartTracing<ResponseTuringMachineDesign>(nameof(GetTuringMachineDesign) , ResponseStatus.DUPLICATED_DESIGN); 
// @formatter:on

            ServerResponse<IList<ResponseTuringMachineTape>> getTapesResponse = GetTapes(designID , db);
            if (getTapesResponse.Status is not ResponseStatus.SUCCESS)
                return getTapesResponse.WithThisTraceInfo<ResponseTuringMachineDesign>(nameof(GetTuringMachineDesign) , ResponseStatus.BACKEND_ERROR);

            List<ResponseTuringMachine> responseTuringMachines = new List<ResponseTuringMachine>(dbDesign.Machines.Count);
            foreach (DbTuringMachine dbMachine in dbDesign.Machines)
            {
                ServerResponse<IList<ResponseTuringMachineHead>> getMachineHeadResponse = GetMachineHead(dbMachine.MachineID.ToString() , db);
                if (getMachineHeadResponse.Status is not ResponseStatus.SUCCESS)
                    return getTapesResponse.WithThisTraceInfo<ResponseTuringMachineDesign>(nameof(GetTuringMachineDesign) , ResponseStatus.BACKEND_ERROR);

                ServerResponse<ICollection<ResponseTransition>> getTransitionResponse = GetTuringMachineTransitions(dbMachine.MachineID.ToString() , db);
                if (getTransitionResponse.Status is not ResponseStatus.SUCCESS)
                {
                    return getTransitionResponse.WithThisTraceInfo<ResponseTuringMachineDesign>(
                        nameof(GetTuringMachineDesign) ,
                        getTransitionResponse.Status is ResponseStatus.DESIGN_NOT_FOUND or ResponseStatus.NO_SUCH_ITEM
                            ? ResponseStatus.DESIGN_NOT_FOUND
                            : ResponseStatus.BACKEND_ERROR
                    );
                }

                ResponseTuringMachine responseTuringMachine = new ResponseTuringMachine { Transitions = getTransitionResponse.Result! , Heads = getMachineHeadResponse.Result! , StartNode = dbMachine.StartNode };

                // If the machine has label, assign label to the machine. 
                // Otherwise, set label to null.
                ServerResponse<MachineLabel> getMachineLabelResponse = MachineLabelInteraction.GetMachineLabel(dbMachine.MachineID.ToString() , db);
                switch (getMachineLabelResponse.Status)
                {
                    case ResponseStatus.SUCCESS:
                        responseTuringMachine.Label = getMachineLabelResponse.Result;
                        break;

                    case ResponseStatus.NO_SUCH_ITEM:
                        responseTuringMachine.Label = null;
                        break;

                    default: return getMachineLabelResponse.WithThisTraceInfo<ResponseTuringMachineDesign>(nameof(GetTuringMachineDesign) , ResponseStatus.BACKEND_ERROR);
                }
                responseTuringMachines.Add(responseTuringMachine);
            }
            return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.SUCCESS , new ResponseTuringMachineDesign { Tapes = getTapesResponse.Result! , Machines = responseTuringMachines });
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

            if (design.Machines is not null)
            {
                ServerResponse insertTuringMachineTapesResponse = await InsertTuringMachineTapesAsync(design.Tapes , designID , db);
                if (insertTuringMachineTapesResponse.Status is not ResponseStatus.SUCCESS)
                    return insertTuringMachineTapesResponse.WithThisTraceInfo<string>(nameof(InsertTuringMachineDesignAsync) , ResponseStatus.BACKEND_ERROR);
            }


            if (design.Machines is not null)
                foreach (ResponseTuringMachine machine in design.Machines)
                {
                    ServerResponse insertTuringMachineResponse = await InsertTuringMachineAsync(machine , designID , db);
                    if (insertTuringMachineResponse.Status is not ResponseStatus.SUCCESS)
                        return insertTuringMachineResponse.WithThisTraceInfo<string>(nameof(InsertTuringMachineDesignAsync) , ResponseStatus.BACKEND_ERROR);
                }

            await db.SaveChangesAsync();
            return new ServerResponse<string>(ResponseStatus.SUCCESS , designID);
        }

        /// <returns>
        ///     When successfully update a Turing Machine design, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse> UpdateTuringMachineDesignAsync(string oldDesignID , ResponseTuringMachineDesign newDesign , DataContext db)  // BUG: when updating, the new design should have the same design ID as the old design.
        {
            ServerResponse response;

            response = await DeleteTuringMachineDesignAsync(oldDesignID , db);
            if (response.Status is not ResponseStatus.SUCCESS)
                return response.WithThisTraceInfo(nameof(UpdateTuringMachineDesignAsync) , ResponseStatus.BACKEND_ERROR);

            response = await InsertTuringMachineDesignAsync(newDesign , db);
            if (response.Status is not ResponseStatus.SUCCESS)
                return response.WithThisTraceInfo(nameof(UpdateTuringMachineDesignAsync) , ResponseStatus.BACKEND_ERROR);

            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully deleted a Turing Machine design, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse> DeleteTuringMachineDesignAsync(string designID , DataContext db)
        {
            using IEnumerator<DbTuringMachineDesign> designs = db.MachineDesigns.Where(design => design.DesignID.ToString() == designID).GetEnumerator();
            if (!designs.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteTuringMachineDesignAsync) , ResponseStatus.NO_SUCH_ITEM);
            DbTuringMachineDesign dbDesign = designs.Current;
            if (designs.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteTuringMachineDesignAsync) , ResponseStatus.DUPLICATED_ITEM);

            if (dbDesign.Machines is not null)
            {
                foreach (DbTuringMachine dbDesignMachine in dbDesign.Machines)
                {
                    ServerResponse response;

                    string machineID = dbDesignMachine.MachineID.ToString();

                    response = await DeleteMachineTransitionsAsync(machineID , db);
                    if (response.Status != ResponseStatus.SUCCESS)
                        return response.WithThisTraceInfo(nameof(DeleteTuringMachineDesignAsync) , ResponseStatus.BACKEND_ERROR);

                    response = await DeleteMachineHeadsAsync(machineID , db);
                    if (response.Status != ResponseStatus.SUCCESS)
                        return response.WithThisTraceInfo(nameof(DeleteTuringMachineDesignAsync) , ResponseStatus.BACKEND_ERROR);

                    response = await DeleteMachineTapesAsync(machineID , db);
                    if (response.Status != ResponseStatus.SUCCESS)
                        return response.WithThisTraceInfo(nameof(DeleteTuringMachineDesignAsync) , ResponseStatus.BACKEND_ERROR);
                }
                db.MachineDesigns.Remove(dbDesign);
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }


        #region Helper Functions
        #region Get Turing Machine Design
        /// <returns>
        ///     Returns a list of transition (for a particular machine) when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        private static ServerResponse<ICollection<ResponseTransition>> GetTuringMachineTransitions(string machineID , DataContext db)
        {
// @formatter:off
            using IEnumerator<DbTuringMachine> machines = db.Machines.Where(machine => machine.MachineID == Guid.Parse(machineID))
                                                                     .Include(machine => machine.Transitions).ThenInclude(transition => transition.Statements)
                                                                     .GetEnumerator();
// @formatter:on

            if (!machines.MoveNext()) return ServerResponse.StartTracing<ICollection<ResponseTransition>>(nameof(GetTuringMachineTransitions) , ResponseStatus.NO_SUCH_ITEM);
            ICollection<DbTransition> dbTransitions = machines.Current.Transitions;
            if (machines.MoveNext()) return ServerResponse.StartTracing<ICollection<ResponseTransition>>(nameof(GetTuringMachineTransitions) , ResponseStatus.DUPLICATED_ITEM);

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

                ServerResponse<IList<Point>> getPathResponse = DbTransitionLinePathInteraction.GetTransitionLinePath(dbTransition.TransitionID.ToString() , db);
                if (getPathResponse.Status != ResponseStatus.SUCCESS)
                    return getPathResponse.WithThisTraceInfo<ICollection<ResponseTransition>>(nameof(GetTuringMachineTransitions) , ResponseStatus.BACKEND_ERROR);

                responseTransitions.Add(
                    new ResponseTransition
                    {
                        Source = dbTransition.Source ,
                        Target = dbTransition.Target ,
                        Statements = responseTransitionStatements ,
                        TransitionLineSteps = getPathResponse.Result ,
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

                    default: return ServerResponse.StartTracing<IList<ResponseTuringMachineHead>>(nameof(GetMachineHead) , ResponseStatus.BACKEND_ERROR);
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
        public static ServerResponse<IList<ResponseTuringMachineTape>> GetTapes(string designID , DataContext db)
        {
            IQueryable<DbTuringMachineTape> dbTapes = db.Tapes.Where(tape => tape.DesignID.ToString() == designID);

            ResponseTuringMachineTape[] responseTapes = new ResponseTuringMachineTape[dbTapes.Count()];
            foreach (DbTuringMachineTape tape in dbTapes)
                responseTapes[tape.TapeIndex] = new ResponseTuringMachineTape
                {
                    Type     = tape.TapeType ,
                    Values   = tape.TapeValues ,
                    IsInput  = tape.IsInput ,
                    IsOutput = tape.IsOutput ,
                };

            return new ServerResponse<IList<ResponseTuringMachineTape>>(ResponseStatus.SUCCESS , responseTapes);
        }
        #endregion

        #region Insert Turing Machine Design
        /// <returns>
        ///     When successfully inserted a list of turing machine tapes, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
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

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
// @formatter:on
        }

        /// <returns>
        ///     When successfully inserted a turing machine, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        private static async Task<ServerResponse> InsertTuringMachineAsync(ResponseTuringMachine machine , string designID , DataContext db)  // TODO: clear changes when failure, change BACKEND_ERROR to FAILURE when cleared.
        {
            DbTuringMachine dbMachine = new DbTuringMachine
            {
                MachineID = Guid.NewGuid() ,
                DesignID  = Guid.Parse(designID) ,
                StartNode = machine.StartNode ,
            };
            string machineID = dbMachine.MachineID.ToString();
            db.Machines.Add(dbMachine);

            if (machine.Heads is not null)
            {
                ServerResponse insertTuringMachineResponse = await InsertTuringMachineHeadAsync(machine.Heads , machineID , db);
                if (insertTuringMachineResponse.Status is not ResponseStatus.SUCCESS)
                    return insertTuringMachineResponse.WithThisTraceInfo(nameof(InsertTuringMachineAsync) , ResponseStatus.BACKEND_ERROR);
            }

            if (machine.Transitions is not null)
                foreach (ResponseTransition transition in machine.Transitions)
                {
                    ServerResponse insertTransitionResponse = await InsertTransitionAsync(transition , machineID , db);
                    if (insertTransitionResponse.Status is not ResponseStatus.SUCCESS)
                        return insertTransitionResponse.WithThisTraceInfo(nameof(InsertTuringMachineAsync) , ResponseStatus.BACKEND_ERROR);
                }

            if (machine.Label is not null)
            {
                ServerResponse insertMachineLabelResponse = await MachineLabelInteraction.InsertMachineLabelAsync(machine.Label , machineID , db);
                if (insertMachineLabelResponse.Status is not ResponseStatus.SUCCESS)
                    return insertMachineLabelResponse.WithThisTraceInfo(nameof(InsertTuringMachineAsync) , ResponseStatus.BACKEND_ERROR);
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully inserted a list of turing machine heads, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
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

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
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

            if (transition.Statements is not null)
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

            if (transition.TransitionLineSteps is not null)
            {
                ServerResponse insertTransitionLinePathResponse = DbTransitionLinePathInteraction.InsertTransitionLinePath(dbTransition.TransitionID.ToString() , transition.TransitionLineSteps , db);
                if (insertTransitionLinePathResponse.Status is not ResponseStatus.SUCCESS)
                    return insertTransitionLinePathResponse.WithThisTraceInfo(nameof(InsertTransitionAsync) , ResponseStatus.BACKEND_ERROR);
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        #endregion

        #region Delete Turing Machine Design
        /// <returns>
        ///     When successfully deleted a list of tapes associated to a Turing Machine design, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "DUPLICATED_ITEM".
        /// </returns>
        public static async Task<ServerResponse> DeleteMachineTapesAsync(string designID , DataContext db)
        {
            using IEnumerator<DbTuringMachineDesign> machines = db.MachineDesigns.Where(design => design.DesignID.ToString() == designID).GetEnumerator();
            
            if (!machines.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteMachineTapesAsync) , ResponseStatus.NO_SUCH_ITEM);
            DbTuringMachineDesign dbDesign = machines.Current;
            if (machines.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteMachineTapesAsync) , ResponseStatus.DUPLICATED_ITEM);

            db.Tapes.RemoveRange(db.Tapes.Where(tape => tape.DesignID == dbDesign.DesignID));
            
            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully deleted a list of heads associated to a Turing Machine, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "DESIGN_NOT_FOUND" or "DUPLICATED_DESIGN".
        /// </returns>
        public static async Task<ServerResponse> DeleteMachineHeadsAsync(string machineID , DataContext db)
        {
            using IEnumerator<DbTuringMachine> machines = db.Machines.Where(machine => machine.MachineID.ToString() == machineID).GetEnumerator();
            
            if (!machines.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteMachineTapesAsync) , ResponseStatus.DESIGN_NOT_FOUND);
            DbTuringMachine dbMachine = machines.Current;
            if (machines.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteMachineTapesAsync) , ResponseStatus.DUPLICATED_DESIGN);
            
            db.Heads.RemoveRange(db.Heads.Where(head => head.MachineID == dbMachine.MachineID));
            
            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully deleted a list of transitions associated to a Turing Machine design, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static async Task<ServerResponse> DeleteMachineTransitionsAsync(string machineID , DataContext db)
        {
            foreach (DbTransition transition in db.Transition.Where(transition => transition.MachineID.ToString() == machineID))
            {
                db.TransitionStatements.RemoveRange(db.TransitionStatements.Where(statement => statement.TransitionID == transition.TransitionID));
                await DbTransitionLinePathInteraction.DeleteTransitionLinePathAsync(transition.TransitionID.ToString() , db);
                db.Transition.Remove(transition);
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully deleted a turing machine, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "DUPLICATED_ITEM".
        /// </returns>
        public static async Task<ServerResponse> DeleteTuringMachineAsync(string machineID , DataContext db)
        {
            using IEnumerator<DbTuringMachine> machines = db.Machines.Where(machine => machine.MachineID.ToString() == machineID).GetEnumerator();

            if (!machines.MoveNext()) return new ServerResponse(ResponseStatus.NO_SUCH_ITEM);
            DbTuringMachine dbMachine = machines.Current;
            if (machines.MoveNext()) return new ServerResponse(ResponseStatus.DUPLICATED_ITEM);

            db.Machines.Remove(dbMachine);
            
            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        #endregion
        #endregion
    }
}
