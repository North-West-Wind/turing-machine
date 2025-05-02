using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Machines.Heads;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

#region Type Alias
// @formatter:off
using DbTuringMachineDesign = TuringMachine.Backend.Server.Database.Entity.Machine.MachineDesign;
using DbTuringMachineTape   = TuringMachine.Backend.Server.Database.Entity.Machine.Tape;
using DbTuringMachine       = TuringMachine.Backend.Server.Database.Entity.Machine.Machine;
using DbTransition          = TuringMachine.Backend.Server.Database.Entity.Machine.Transition;
using DbTransitionStatement = TuringMachine.Backend.Server.Database.Entity.Machine.TransitionStatement;
using DbTuringMachineHead   = TuringMachine.Backend.Server.Database.Entity.Machine.Head;

using ResponseTuringMachineDesign = TuringMachine.Backend.Server.Models.Machines.TuringMachineDesign;
using ResponseTuringMachineTape   = TuringMachine.Backend.Server.Models.Machines.Tapes.Tape;
using ResponseTuringMachine       = TuringMachine.Backend.Server.Models.Machines.TuringMachine;
using ResponseTransition          = TuringMachine.Backend.Server.Models.Machines.Transitions.Transition;
using ResponseTransitionStatement = TuringMachine.Backend.Server.Models.Machines.Transitions.TransitionStatement;
using ResponseTuringMachineHead   = TuringMachine.Backend.Server.Models.Machines.Heads.Head;
using ResponseTuringMachineLabel  = TuringMachine.Backend.Server.Models.Machines.UI.MachineLabel;
// @formatter:on
#endregion


namespace TuringMachine.Backend.Server.DbInteraction
{
    internal static class MachineInteraction
    {
        /// <returns>
        ///     Returns a turing machine design when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "MACHINE_NOT_FOUND", "DUPLICATED_MACHINE", "DUPLICATED_MACHINE_LABEL" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse<ResponseTuringMachineDesign>> GetTuringMachineAsync(string designID , DataContext db)
        {
// @formatter:off
            using IEnumerator<DbTuringMachineDesign> designs = db.MachineDesigns.Where(design => design.DesignID.ToString() == designID)
                                                                                .Include(design => design.Tapes)
                                                                                .Include(design => design.Machines).ThenInclude(machine => machine.Transitions).ThenInclude(transition => transition.Statements)
                                                                                .Include(design => design.Machines).ThenInclude(machine => machine.Heads)
                                                                                .GetEnumerator();

            if (!designs.MoveNext()) { return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.MACHINE_NOT_FOUND ); }
            DbTuringMachineDesign dbDesign = designs.Current;
            if ( designs.MoveNext()) { return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.DUPLICATED_MACHINE); }
// @formatter:on

            ResponseTuringMachineTape[] responseTapes = new ResponseTuringMachineTape[dbDesign.Tapes.Count];
            foreach (DbTuringMachineTape dbTape in dbDesign.Tapes)
                responseTapes[dbTape.TapeIndex] = new ResponseTuringMachineTape { Type = dbTape.TapeType , Values = dbTape.TapeValues?.ToCharArray() };

            List<ResponseTuringMachine> responseTuringMachines = new List<ResponseTuringMachine>(dbDesign.Machines.Count);
            foreach (DbTuringMachine dbMachine in dbDesign.Machines)
            {
                List<ResponseTransition> responseTransitions = new List<ResponseTransition>(dbMachine.Transitions.Count);
                foreach (DbTransition dbMachineTransition in dbMachine.Transitions)
                {
                    ResponseTransitionStatement[] responseTransitionStatements = new ResponseTransitionStatement[dbMachineTransition.Statements.Count];
                    foreach (DbTransitionStatement dbTransitionStatement in dbMachineTransition.Statements)
                        responseTransitionStatements[dbTransitionStatement.StatementIndex] = new ResponseTransitionStatement
                        {
                            Read  = dbTransitionStatement.Read ,
                            Write = dbTransitionStatement.Write ,
                            Move  = dbTransitionStatement.Move ,
                        };

                    responseTransitions.Add(
                        new ResponseTransition
                        {
                            Source     = dbMachineTransition.Source ,
                            Target     = dbMachineTransition.Target ,
                            Statements = responseTransitionStatements ,
                        }
                    );
                }

                ResponseTuringMachineHead[] responseMachineHeads = new ResponseTuringMachineHead[dbMachine.Heads.Count];
                foreach (DbTuringMachineHead dbMachineHead in dbMachine.Heads)
                {
                    HeadType headType;
// @formatter:off
                    switch (dbMachineHead.IsReadable, dbMachineHead.IsWritable)
                    {
                        case (true , false): headType = HeadType.Read     ; break;
                        case (false, true ): headType = HeadType.Write    ; break;
                        case (true , true ): headType = HeadType.ReadWrite; break;

                        default: return new ServerResponse<ResponseTuringMachineDesign>(ResponseStatus.BACKEND_ERROR);
                    }
// @formatter:on
                    responseMachineHeads[dbMachineHead.HeadIndex] = new ResponseTuringMachineHead
                    {
                        Type     = headType ,
                        Position = dbMachineHead.Position ,
                        Tape     = dbMachineHead.TapeReferenceIndex ,
                    };
                }

                ResponseTuringMachine responseTuringMachine = new ResponseTuringMachine { Transitions = responseTransitions , Heads = responseMachineHeads };
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
    }
}
