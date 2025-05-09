using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.DbInteraction.Machine;
using TuringMachine.Backend.Server.DbInteraction.UserManagement;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.Models.UserManagement;
using TuringMachine.Backend.Server.ServerResponses;
using TuringMachine.Backend.Server.ServerResponses.ResponseBody;

#region Type Alias
using DbLevelProgress = TuringMachine.Backend.Server.Database.Entity.Progress.LevelProgress;

using ResponseLevelProgress = TuringMachine.Backend.Server.ServerResponses.ResponseBody.ProgressResponseBody;
using ResponseTuringMachineDesign = TuringMachine.Backend.Server.Models.Machines.TuringMachineDesign;
#endregion

namespace TuringMachine.Backend.Server.DbInteraction.Progress
{
    internal static class ProgressInteraction
    {
        /// <returns>
        ///     Returns level progress when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ResponseLevelProgress> GetProgress(string uuid , byte levelID , DataContext db)
        {
// @formatter:off 
            using IEnumerator<DbLevelProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID.ToString() == uuid && progress.LevelID == levelID)
                                                                              .Include(progress => progress.Solution)
                                                                              .GetEnumerator();
// @formatter:on

            if (!progresses.MoveNext()) return ServerResponse.StartTracing<ResponseLevelProgress>(nameof(GetProgress) , ResponseStatus.NO_SUCH_ITEM);
            DbLevelProgress dbLevelProgress = progresses.Current;
            if (progresses.MoveNext()) return ServerResponse.StartTracing<ResponseLevelProgress>(nameof(GetProgress) , ResponseStatus.DUPLICATED_ITEM);

            ResponseLevelProgress responseLevelProcess = new ResponseLevelProgress
            {
                Level = dbLevelProgress.LevelID ,
                Time  = dbLevelProgress.SubmissionTime ,
            };

            if (dbLevelProgress.DesignID is null)
                return new ServerResponse<ResponseLevelProgress>(ResponseStatus.SUCCESS , responseLevelProcess);

            // obtain last user saved the turing machine design
            ServerResponse<ResponseTuringMachineDesign> getDesignResponse = MachineInteraction.GetTuringMachineDesign(dbLevelProgress.DesignID.ToString()! , db);

            responseLevelProcess.MachineDesign = getDesignResponse.Result;
            return getDesignResponse.Status switch
            {
                ResponseStatus.SUCCESS => new ServerResponse<ResponseLevelProgress>(ResponseStatus.SUCCESS , responseLevelProcess) ,
                _                      => getDesignResponse.WithThisTraceInfo<ResponseLevelProgress>(nameof(GetProgress) , ResponseStatus.BACKEND_ERROR) ,
            };
        }

        /// <returns>
        ///     Returns level progress when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse<ResponseLevelProgress>> GetLatestProgressAsync(string uuid , DataContext db)
        {
            IQueryable<DbLevelProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID.ToString() == uuid);
            if (progresses.IsNullOrEmpty())
                return ServerResponse.StartTracing<ResponseLevelProgress>(nameof(GetLatestProgressAsync) , ResponseStatus.NO_SUCH_ITEM);

// @formatter:off
            DbLevelProgress? latestProgress = await (   
                    from progress in progresses
                    orderby progress.SubmissionTime
                    select progress
                ).FirstAsync();
            
            return latestProgress is null ? new ServerResponse<ResponseLevelProgress>(ResponseStatus.NO_SUCH_ITEM) 
                                          : GetProgress(uuid , latestProgress.LevelID , db);
// @formatter:on
        }

        /// <returns>
        ///     When successfully inserted a new progress, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse> InsertProgressAsync(string uuid , byte levelID , DataContext db) => await InsertProgressAsync(uuid , levelID , null , false , db);

        /// <returns>
        ///     When successfully inserted a new progress (with optional design), return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse> InsertProgressAsync(string uuid , byte levelID , ResponseTuringMachineDesign? design , bool isSolved , DataContext db)
        {
            string? designID = null;

            if (design is not null)
            {
                ServerResponse<string> insertDesignResponse = await MachineInteraction.InsertTuringMachineDesignAsync(design , db);
                if (insertDesignResponse.Status != ResponseStatus.SUCCESS)
                    return insertDesignResponse.WithThisTraceInfo(nameof(InsertProgressAsync) , ResponseStatus.BACKEND_ERROR);
            }

            DbLevelProgress dbLevelProgress = new DbLevelProgress
            {
                UUID           = Guid.Parse(uuid) ,
                LevelID        = levelID ,
                IsSolved       = isSolved ,
                DesignID       = designID is null ? null : Guid.NewGuid() ,
                SubmissionTime = DateTime.Now ,
            };
            db.LevelProgresses.Add(dbLevelProgress);

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully update a progress info, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse> UpdateProgress(string uuid , byte levelID , ResponseLevelProgress level , bool isSolved , DataContext db)
        {
            await DeleteProgressAsync(uuid , levelID , true , db);

            ServerResponse response = await InsertProgressAsync(uuid , levelID , level.MachineDesign , isSolved , db);
            if (response.Status != ResponseStatus.SUCCESS)
                return response.WithThisTraceInfo(nameof(UpdateProgress) , ResponseStatus.BACKEND_ERROR);

            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully update a progress info, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse> UpdateProgress(string uuid , byte levelID , ResponseTuringMachineDesign design , bool isSolved , DataContext db)
        {
            await DeleteProgressAsync(uuid , levelID , true ,db);

            ServerResponse response = await InsertProgressAsync(uuid , levelID , design , isSolved , db);
            if (response.Status != ResponseStatus.SUCCESS)
                return response.WithThisTraceInfo(nameof(UpdateProgress) , ResponseStatus.BACKEND_ERROR);

            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully deleted a progress info, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse> DeleteProgressAsync(string uuid , byte levelID , bool isDesignRemovable, DataContext db)
        {
// @formatter:off
            using IEnumerator<DbLevelProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID.ToString() == uuid && progress.LevelID == levelID)
                                                                              .Include(progress => progress.Solution)
                                                                              .GetEnumerator();
// @formatter:on
            if (!progresses.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteProgressAsync) , ResponseStatus.NO_SUCH_ITEM);
            DbLevelProgress dbLevelProgress = progresses.Current;
            if (progresses.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteProgressAsync) , ResponseStatus.DUPLICATED_ITEM);

            if (isDesignRemovable && dbLevelProgress.DesignID is not null)
            {
                ServerResponse response = await MachineInteraction.DeleteTuringMachineDesignAsync(dbLevelProgress.DesignID.ToString()! , db);
                if (response.Status != ResponseStatus.SUCCESS)
                    return response.WithThisTraceInfo(nameof(DeleteProgressAsync) , ResponseStatus.BACKEND_ERROR);
            }

            db.LevelProgresses.Remove(dbLevelProgress);

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
    }
}
