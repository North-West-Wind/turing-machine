using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Database.Entity.UserManagement;
using TuringMachine.Backend.Server.DbInteractions.UIInteractions;
using TuringMachine.Backend.Server.Models.MachineDesigns;
using TuringMachine.Backend.Server.Models.Misc;
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
        /// <returns>
        ///     Return a machine design when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM", "USER_NOT_FOUND", "DUPLICATED_USER", "ITEM_NUMBER_MISMATCH" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ResponseMachineDesign> GetMachineDesign(string designID , DataContext db)
        {
            using IEnumerator<DbMachineDesign> dbMachineDesigns = db.MachineDesigns.Where(machine => machine.DesignID == Guid.Parse(designID)).GetEnumerator();
            if (!dbMachineDesigns.MoveNext()) return ServerResponse.StartTracing<ResponseMachineDesign>(nameof(GetMachineDesign) , NO_SUCH_ITEM);
            DbMachineDesign dbMachineDesign = dbMachineDesigns.Current;
            if (dbMachineDesigns.MoveNext()) return ServerResponse.StartTracing<ResponseMachineDesign>(nameof(GetMachineDesign) , DUPLICATED_ITEM);

            // find the associated author
            using IEnumerator<DbUser> dbUsers = db.Users.Where(user => user.UUID == dbMachineDesign.Author).GetEnumerator();
            if (!dbUsers.MoveNext()) return ServerResponse.StartTracing<ResponseMachineDesign>(nameof(GetMachineDesign) , USER_NOT_FOUND); // BUG: when user not found, should return unknown in the author field (in json)
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
                    UILabel       = uiEnumerator.Current ,
                };
            responseMachineDesign.Machines = machineUiConfigPairs;
            #endregion

            return new ServerResponse<ResponseMachineDesign>(SUCCESS , responseMachineDesign);
        }


        public static async Task<ServerResponse<string>> UpdateAndSaveMachineDesign(ResponseMachineDesign design , string designID , DataContext db)
        {
            ServerResponse deleteMachineDesignResponse = DeleteMachineDesign(designID , db);
            if (deleteMachineDesignResponse.Status is not SUCCESS)
                return deleteMachineDesignResponse.WithThisTraceInfo<string>(nameof(UpdateAndSaveMachineDesign) , deleteMachineDesignResponse.Status);

            ServerResponse<string> createMachineDesignResponse = CreateMachineDesign(design , designID , db);
            if (createMachineDesignResponse.Status is not SUCCESS)
                return createMachineDesignResponse.WithThisTraceInfo<string>(nameof(CreateAndSaveMachineDesign) , createMachineDesignResponse.Status);

            await db.SaveChangesAsync();
            return createMachineDesignResponse;
        }

        public static async Task<ServerResponse<string>> CreateAndSaveMachineDesign(ResponseMachineDesign design , DataContext db)
        {
            ServerResponse<string> createMachineDesignResponse = CreateMachineDesign(design , db);
            if (createMachineDesignResponse.Status is not SUCCESS)
                return createMachineDesignResponse.WithThisTraceInfo<string>(nameof(CreateAndSaveMachineDesign) , createMachineDesignResponse.Status);

            await db.SaveChangesAsync();
            return createMachineDesignResponse;
        }

        public static ServerResponse<string> CreateMachineDesign(ResponseMachineDesign design , DataContext db) => CreateMachineDesign(design , Guid.NewGuid().ToString() , db);

        private static ServerResponse<string> CreateMachineDesign(ResponseMachineDesign design , string designID , DataContext db)
        {
            // find the author
            using IEnumerator<DbUser> users = db.Users.Where(user => user.Username == design.Author).GetEnumerator();
            if (!users.MoveNext()) return ServerResponse.StartTracing<string>(nameof(CreateMachineDesign) , USER_NOT_FOUND);
            DbUser author = users.Current;
            if (users.MoveNext()) return ServerResponse.StartTracing<string>(nameof(CreateMachineDesign) , DUPLICATED_USER);

            DbMachineDesign machineDesign = new DbMachineDesign
            {
                DesignID = Guid.Parse(designID) ,
                Author   = author.UUID ,

                LevelID         = design.LevelID ,
                TransitionCount = design.TransitionCount ?? 0 ,
                StateCount      = design.StateCount      ?? 0 ,
                HeadCount       = design.HeadCount       ?? 0 ,
                TapeCount       = design.TapeCount       ?? 0 ,
                OperationCount  = design.OperationCount  ?? 0 ,

                InputTapeIndex  = design.TapeInfo.InputTape ,
                OutputTapeIndex = design.TapeInfo.OutputTape ,
            };
            db.MachineDesigns.Add(machineDesign);

            ServerResponse insertTapesResponse = DbTapeInteraction.InsertTapes(designID , design.TapeInfo.Tapes , db);
            if (insertTapesResponse.Status is not SUCCESS)
                return insertTapesResponse.WithThisTraceInfo<string>(nameof(CreateMachineDesign) , BACKEND_ERROR);

            ServerResponse insertMachinesResponse = DbMachineInteraction.InsertMachines(designID , design.Machines.Select(machine => machine.MachineConfig).ToList() , db);
            if (insertMachinesResponse.Status is not SUCCESS)
                return insertMachinesResponse.WithThisTraceInfo<string>(nameof(CreateMachineDesign) , BACKEND_ERROR);

            ServerResponse insertUiInfosResponse = DbUIInfoInteraction.InsertUIInfos(designID , design.Machines.Select(machine => machine.UILabel).ToList() , db);
            if (insertUiInfosResponse.Status is not SUCCESS)
                return insertUiInfosResponse.WithThisTraceInfo<string>(nameof(CreateMachineDesign) , BACKEND_ERROR);

            return new ServerResponse<string>(SUCCESS , designID);
        }

        public static async Task<ServerResponse> DeleteAndCommitMachineDesign(string designID , DataContext db)
        {
            ServerResponse deleteMachineDesignResponse = DeleteMachineDesign(designID , db);
            if (deleteMachineDesignResponse.Status is not SUCCESS)
                return deleteMachineDesignResponse.WithThisTraceInfo<string>(nameof(DeleteAndCommitMachineDesign) , deleteMachineDesignResponse.Status);

            await db.SaveChangesAsync();
            return deleteMachineDesignResponse;
        }

        public static ServerResponse DeleteMachineDesign(string designID , DataContext db)
        {
            using IEnumerator<DbMachineDesign> dbMachineDesigns = db.MachineDesigns.Where(machine => machine.DesignID == Guid.Parse(designID)).GetEnumerator();
            if (!dbMachineDesigns.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteMachineDesign) , NO_SUCH_ITEM);
            DbMachineDesign dbMachineDesign = dbMachineDesigns.Current;
            if (dbMachineDesigns.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteMachineDesign) , DUPLICATED_ITEM);

            db.MachineDesigns.Remove(dbMachineDesign);

            ServerResponse deleteMachineResponse = DbMachineInteraction.DeleteMachines(designID , db);
            if (deleteMachineResponse.Status is not SUCCESS)
                return deleteMachineResponse.WithThisTraceInfo(nameof(DeleteMachineDesign) , BACKEND_ERROR);

            ServerResponse deleteTapeResponse = DbTapeInteraction.DeleteTapes(designID , db);
            if (deleteTapeResponse.Status is not SUCCESS)
                return deleteTapeResponse.WithThisTraceInfo(nameof(DeleteMachineDesign) , BACKEND_ERROR);

            ServerResponse deleteUiResponse = DbUIInfoInteraction.DeleteUIInfos(designID , db);
            if (deleteUiResponse.Status is not SUCCESS)
                return deleteUiResponse.WithThisTraceInfo(nameof(DeleteMachineDesign) , BACKEND_ERROR);

            return new ServerResponse<string>(SUCCESS , designID);
        }
    }
}
