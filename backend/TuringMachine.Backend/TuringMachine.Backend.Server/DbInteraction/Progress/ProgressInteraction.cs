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
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM", "DUPLICATED_MACHINE" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse<ResponseLevelProgress>> GetProgressAsync(string uuid , byte levelID , DataContext db)
        {
// @formatter:off 
            using IEnumerator<DbLevelProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID.ToString() == uuid && progress.LevelID == levelID)
                                                                              .Include(progress => progress.Solution)
                                                                              .GetEnumerator();

            if (!progresses.MoveNext()) return new ServerResponse<ResponseLevelProgress>(ResponseStatus.NO_SUCH_ITEM   );
            DbLevelProgress dbLevelProgress = progresses.Current;
            if ( progresses.MoveNext()) return new ServerResponse<ResponseLevelProgress>(ResponseStatus.DUPLICATED_ITEM); 
// @formatter:on

            ResponseLevelProgress responseLevelProcess = new ResponseLevelProgress
            {
                Level = dbLevelProgress.LevelID ,
                Time  = dbLevelProgress.SubmissionTime ,
            };

            if (dbLevelProgress.DesignID is null)
                return new ServerResponse<ResponseLevelProgress>(ResponseStatus.SUCCESS , responseLevelProcess);

            // obtain last user saved the turing machine design
            (ResponseStatus status , ResponseTuringMachineDesign? design) = MachineInteraction.GetTuringMachineDesign(dbLevelProgress.DesignID.ToString()! , db).ToTuple();
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

        /// <returns>
        ///     Returns level progress when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM", "DUPLICATED_MACHINE" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse<ResponseLevelProgress>> GetLatestProgressAsync(string uuid , DataContext db)
        {
            IQueryable<DbLevelProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID.ToString() == uuid);
            if (progresses.IsNullOrEmpty())
                return new ServerResponse<ResponseLevelProgress>(ResponseStatus.NO_SUCH_ITEM);

// @formatter:off
            DbLevelProgress? latestProgress = await (   from progress in progresses
                                                        orderby progress.SubmissionTime
                                                        select progress
                                                    ).FirstAsync();
            
            return latestProgress is null ? new ServerResponse<ResponseLevelProgress>(ResponseStatus.NO_SUCH_ITEM) 
                                          : await GetProgressAsync(uuid , latestProgress.LevelID , db);
// @formatter:on
        }

        /// <returns>
        ///     When successfully inserted a new progress, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static async Task<ServerResponse> InsertProgressAsync(string uuid , byte levelID , DataContext db) => await InsertProgressAsync(uuid , levelID , null , false , db);

        /// <returns>
        ///     When successfully inserted a new progress (with optional design), return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static async Task<ServerResponse> InsertProgressAsync(string uuid , byte levelID , ResponseTuringMachineDesign? design , bool isSolved , DataContext db)
        {
            string? designID = null;

            if (design is not null)
            {
                (ResponseStatus status , designID) = (await MachineInteraction.InsertTuringMachineDesignAsync(design , db)).ToTuple();
                if (status != ResponseStatus.SUCCESS)
                    return new ServerResponse<ResponseLevelProgress>(status);
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
        ///     Status is either "SUCCESS", "MACHINE_NOT_FOUND", "DUPLICATED_MACHINE", "NO_SUCH_ITEM" or "DUPLICATED_ITEM".
        /// </returns>
        public static async Task<ServerResponse> UpdateProgress(string uuid , byte levelID , ResponseLevelProgress level , bool isSolved , DataContext db)
        {
            await DeleteProgressAsync(uuid , levelID , true , db);

            ServerResponse response = await InsertProgressAsync(uuid , levelID , level.MachineDesign , isSolved , db);
            if (response.Status != ResponseStatus.SUCCESS)
                return new ServerResponse<ResponseLevelProgress>(response.Status);

            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully update a progress info, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "MACHINE_NOT_FOUND", "DUPLICATED_MACHINE", "NO_SUCH_ITEM" or "DUPLICATED_ITEM".
        /// </returns>
        public static async Task<ServerResponse> UpdateProgress(string uuid , byte levelID , ResponseTuringMachineDesign design , bool isSolved , DataContext db)
        {
            await DeleteProgressAsync(uuid , levelID , true ,db);

            ServerResponse response = await InsertProgressAsync(uuid , levelID , design , isSolved , db);
            if (response.Status != ResponseStatus.SUCCESS)
                return new ServerResponse<ResponseLevelProgress>(response.Status);

            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully deleted a progress info, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "MACHINE_NOT_FOUND", "DUPLICATED_MACHINE", "NO_SUCH_ITEM" or "DUPLICATED_ITEM".
        /// </returns>
        public static async Task<ServerResponse> DeleteProgressAsync(string uuid , byte levelID , bool isDesignRemovable, DataContext db)
        {
// @formatter:off
            using IEnumerator<DbLevelProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID.ToString() == uuid && progress.LevelID == levelID)
                                                                              .Include(progress => progress.Solution)
                                                                              .GetEnumerator();
// @formatter:on
            if (!progresses.MoveNext()) return new ServerResponse<ResponseLevelProgress>(ResponseStatus.NO_SUCH_ITEM);
            DbLevelProgress dbLevelProgress = progresses.Current;
            if (progresses.MoveNext()) return new ServerResponse<ResponseLevelProgress>(ResponseStatus.DUPLICATED_ITEM);

            if (isDesignRemovable && dbLevelProgress.DesignID is not null)
            {
                ServerResponse response = await MachineInteraction.DeleteTuringMachineDesignAsync(dbLevelProgress.DesignID.ToString()! , db);
                if (response.Status != ResponseStatus.SUCCESS)
                    return new ServerResponse<ResponseLevelProgress>(response.Status);
            }

            db.LevelProgresses.Remove(dbLevelProgress);

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
    }
}
