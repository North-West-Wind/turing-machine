using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Database.Entity.UserManagement;
using TuringMachine.Backend.Server.DbInteractions.UIInteractions;
using TuringMachine.Backend.Server.Models.MachineDesigns;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbUser = TuringMachine.Backend.Server.Database.Entity.UserManagement.User;
using DbMachineDesign = TuringMachine.Backend.Server.Database.Entity.MachineStorage.MachineDesign;

using ResponseTapeInfo = TuringMachine.Backend.Server.Models.MachineDesigns.TapeInfo;
using ResponseUILabel = TuringMachine.Backend.Server.Models.UserInterface.UILabel;
using ResponseMachineDesign = TuringMachine.Backend.Server.Models.MachineDesigns.MachineDesign;
using ResponseMachineUIConfigPair = TuringMachine.Backend.Server.Models.MachineDesigns.MachineUIConfigPair;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.DbMachineInteraction
{
    internal static class DbMachineDesignInteraction
    {
        public static ServerResponse<ResponseMachineDesign> GetMachineDesign(string designID , DataContext db)
        {
            using IEnumerator<DbMachineDesign> dbMachineDesigns = db.MachineDesigns.Where(machine => machine.DesignID == Guid.Parse(designID)).GetEnumerator();
            if (!dbMachineDesigns.MoveNext()) return ServerResponse.StartTracing<ResponseMachineDesign>(nameof(GetMachineDesign) , NO_SUCH_ITEM);
            DbMachineDesign dbMachineDesign = dbMachineDesigns.Current;
            if (dbMachineDesigns.MoveNext()) return ServerResponse.StartTracing<ResponseMachineDesign>(nameof(GetMachineDesign) , DUPLICATED_ITEM);

            // find the associated author
            using IEnumerator<DbUser> dbUsers = db.Users.Where(user => user.UUID == dbMachineDesign.Author).GetEnumerator();
            if (!dbUsers.MoveNext()) return ServerResponse.StartTracing<ResponseMachineDesign>(nameof(GetMachineDesign) , USER_NOT_FOUND);  // BUG: when user not found, should return unknown in the author field (in json)
            DbUser author = dbUsers.Current;
            if (dbUsers.MoveNext()) return ServerResponse.StartTracing<ResponseMachineDesign>(nameof(GetMachineDesign) , DUPLICATED_USER);


            ServerResponse<IList<Tape>> getTapeInfosResponse = DbTapeInteraction.GetTapes(designID , db);
            if (getTapeInfosResponse.Status is not SUCCESS)
                return getTapeInfosResponse.WithThisTraceInfo<ResponseMachineDesign>(nameof(GetMachineDesign) , BACKEND_ERROR);


            ResponseMachineDesign responseMachineDesign = new ResponseMachineDesign
            {
                Author  = author.Username ,
                LevelID = dbMachineDesign.LevelID ,

                TapeInfo = new ResponseTapeInfo
                {
                    InputTape  = dbMachineDesign.InputTapeIndex ,
                    OutputTape = dbMachineDesign.OutputTapeIndex ,
                    Tapes      = getTapeInfosResponse.Result! ,
                } ,
            };
            if (responseMachineDesign.LevelID is not null)
            {
                responseMachineDesign.TransitionCount = dbMachineDesign.TransitionCount;
                responseMachineDesign.StateCount      = dbMachineDesign.StateCount;
                responseMachineDesign.HeadCount       = dbMachineDesign.HeadCount;
                responseMachineDesign.TapeCount       = dbMachineDesign.TapeCount;
                responseMachineDesign.OperationCount  = dbMachineDesign.OperationCount;
            }

            #region Machine UI and Logic Config Pairs
            /*  Logic flow:
             *  1. Get all machines with the same designID
             *  2. Get all UI info with the same designID
             *  3. Check if the number of machines and UI info are the same
             *  4. Forming a list of ResponseMachineUIConfigPair
             *      a. Include a machine config
             *      b. Include a UI label
             */
            ServerResponse<IList<MachineConfig>> getMachinesResponse = DbMachineInteraction.GetMachines(designID , db);
            if (getMachinesResponse.Status is not SUCCESS)
                return getMachinesResponse.WithThisTraceInfo<ResponseMachineDesign>(nameof(GetMachineDesign) , BACKEND_ERROR);

            ServerResponse<IList<ResponseUILabel>> getUiInfosResponse = DbUIInfoInteraction.GetUIInfo(designID , db);
            if (getUiInfosResponse.Status is not SUCCESS)
                return getUiInfosResponse.WithThisTraceInfo<ResponseMachineDesign>(nameof(GetMachineDesign) , BACKEND_ERROR);

            if (getMachinesResponse.Result!.Count != getUiInfosResponse.Result!.Count)
                return ServerResponse.StartTracing<ResponseMachineDesign>(nameof(GetMachineDesign) , ITEM_NUMBER_MISMATCH);

            ResponseMachineUIConfigPair[]      machineUiConfigPairs = new ResponseMachineUIConfigPair[getMachinesResponse.Result.Count];
            using IEnumerator<MachineConfig>   machineEnumerator    = getMachinesResponse.Result.GetEnumerator();
            using IEnumerator<ResponseUILabel> uiEnumerator         = getUiInfosResponse.Result.GetEnumerator();
            for (int i = 0; machineEnumerator.MoveNext() && uiEnumerator.MoveNext(); i++)
                machineUiConfigPairs[i] = new ResponseMachineUIConfigPair
                {
                    MachineConfig = machineEnumerator.Current ,
                    UILabel      = uiEnumerator.Current ,
                };
            responseMachineDesign.Machines = machineUiConfigPairs;
            #endregion

            return new ServerResponse<ResponseMachineDesign>(SUCCESS , responseMachineDesign);
        }
    }
}
