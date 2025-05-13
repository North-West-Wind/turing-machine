using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbProgress = TuringMachine.Backend.Server.Database.Entity.ProgressManagement.Progress;
using ResponseProgress = TuringMachine.Backend.Server.Models.Progresses.Progress;
using ResponseMachineDesign = TuringMachine.Backend.Server.Models.MachineDesigns.MachineDesign;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.DbProgressInteractions
{
    internal static class DbLevelProgressInteraction
    {
        /// <returns>
        ///     Return a progress info when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ResponseProgress> GetProgress(string uuid, byte levelID , DataContext db)
        {
            using IEnumerator<DbProgress> progress = db.Progresses
                .Where(progress => progress.LevelID == levelID && progress.UUID == Guid.Parse(uuid))
                .GetEnumerator();
            
            if (!progress.MoveNext()) return ServerResponse.StartTracing<ResponseProgress>(nameof(GetProgress), NO_SUCH_ITEM);
            DbProgress dbProgress = progress.Current;
            if (progress.MoveNext()) return ServerResponse.StartTracing<ResponseProgress>(nameof(GetProgress), DUPLICATED_ITEM);

            ResponseProgress responseProgress = new ResponseProgress{
                UUID          = dbProgress.UUID ,
                LevelID       = dbProgress.LevelID ,
                SubmittedTime = dbProgress.SubmittedTime ,
                DesignID      = dbProgress.DesignID ,
                IsSolved      = dbProgress.IsSolved ,
            };
            
            return new ServerResponse<ResponseProgress>(SUCCESS, responseProgress);
        }

        /// <returns>
        ///     Return a list of progress infos when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse<ICollection<ResponseProgress>>> GetAllProgressAsync(DataContext db)
        {
            List<ResponseProgress> progresses = await db.Progresses
                .Select(
                    bnProgress => new ResponseProgress
                    {
                        UUID          = bnProgress.UUID ,
                        LevelID       = bnProgress.LevelID ,
                        SubmittedTime = bnProgress.SubmittedTime ,
                        DesignID      = bnProgress.DesignID ,
                        IsSolved      = bnProgress.IsSolved ,
                    }
                ).ToListAsync();

            if (progresses.Count == 0) 
                return ServerResponse.StartTracing<ICollection<ResponseProgress>>(nameof(GetAllProgressAsync) , NO_SUCH_ITEM);

            return new ServerResponse<ICollection<ResponseProgress>>(SUCCESS , progresses);
        }

        // TODO: progressing
        /// <returns>
        ///     Update a list of progress when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse UpdateProgress(string uuid, byte levelID, bool isSolved, ResponseMachineDesign design, DataContext db)
        {
            using IEnumerator<DbProgress> progress = db.Progresses
                .Where(progress => progress.LevelID == levelID && progress.UUID == Guid.Parse(uuid))
                .GetEnumerator();

            if (!progress.MoveNext()) return ServerResponse.StartTracing(nameof(UpdateProgress) , NO_SUCH_ITEM);
            DbProgress dbProgress = progress.Current;
            if (progress.MoveNext()) return ServerResponse.StartTracing(nameof(UpdateProgress) , DUPLICATED_ITEM);

            dbProgress.IsSolved      = isSolved;
            dbProgress.SubmittedTime = DateTime.Now;

            return new ServerResponse(SUCCESS);
        }
    }
    
    
}