using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;
using TuringMachine.Backend.Server.ServerResponses.ResponseBody;

#region Type Alias
using DbLevelProgress = TuringMachine.Backend.Server.Database.Entity.Progress.LevelProgress;

using ResponseLevelProgress = TuringMachine.Backend.Server.ServerResponses.ResponseBody.ProgressResponseBody;
using ResponseTuringMachineDesign = TuringMachine.Backend.Server.Models.Machines.TuringMachineDesign;
#endregion

namespace TuringMachine.Backend.Server.DbInteraction
{
    internal static class ProgressInteraction
    {
        /// <returns>
        ///     Returns level progress when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM", "DUPLICATED_MACHINE" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse<ResponseLevelProgress>> GetProgressAsync(string uuid , byte levelID , DataContext db)
        {
// @formatter:off 
            using IEnumerator<DbLevelProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID.ToString() == uuid && progress.LevelID == levelID)
                                                                              .Include(progress => progress.Solution)
                                                                              .GetEnumerator();

            if (!progresses.MoveNext()) { return new ServerResponse<ResponseLevelProgress>(ResponseStatus.NO_SUCH_ITEM   ); }
            DbLevelProgress dbLevelProgress = progresses.Current;
            if ( progresses.MoveNext()) { return new ServerResponse<ResponseLevelProgress>(ResponseStatus.DUPLICATED_ITEM); }
// @formatter:on

            ResponseLevelProgress responseLevelProcess = new ResponseLevelProgress
            {
                Level = dbLevelProgress.LevelID ,
                Time  = dbLevelProgress.SubmissionTime ,
            };

            if (dbLevelProgress.DesignID is null)
                return new ServerResponse<ResponseLevelProgress>(ResponseStatus.SUCCESS , responseLevelProcess);

            // obtain last user saved the turing machine design
            (ResponseStatus status , ResponseTuringMachineDesign? design) = MachineInteraction.GetTuringMachine(dbLevelProgress.DesignID.ToString()! , db).ToTuple();
            responseLevelProcess.MachineDesign = design;
            return status switch
            {
                ResponseStatus.SUCCESS            => new ServerResponse<ResponseLevelProgress>(ResponseStatus.SUCCESS , responseLevelProcess) ,
                ResponseStatus.BACKEND_ERROR      => new ServerResponse<ResponseLevelProgress>(ResponseStatus.BACKEND_ERROR) ,
                ResponseStatus.MACHINE_NOT_FOUND  => new ServerResponse<ResponseLevelProgress>(ResponseStatus.BACKEND_ERROR) ,
                ResponseStatus.DUPLICATED_MACHINE => new ServerResponse<ResponseLevelProgress>(ResponseStatus.DUPLICATED_MACHINE) ,
                _                                 => throw new UnreachableException() ,
            };
        }

        /// <remarks> Response status contains "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM", "DUPLICATED_MACHINE" and "BACKEND_ERROR". </remarks>
        public static async Task<ServerResponse<ResponseLevelProgress>> GetLatestProgressAsync(string uuid , DataContext db)
        {
            IQueryable<DbLevelProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID.ToString() == uuid);
// @formatter:off
            DbLevelProgress? latestProgress = await (   from progress in progresses
                                                        orderby progress.SubmissionTime
                                                        select progress
                                                    ).FirstAsync();
            
            return latestProgress is null ? new ServerResponse<ResponseLevelProgress>(ResponseStatus.NO_SUCH_ITEM) 
                                          : await GetProgressAsync(uuid , latestProgress.LevelID , db);
// @formatter:on
        }
    }
}
