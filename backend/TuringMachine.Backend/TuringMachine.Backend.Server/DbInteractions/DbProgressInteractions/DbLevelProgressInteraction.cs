using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbProgressManagement = TuringMachine.Backend.Server.Database.Entity.ProgressManagement;
using ResponseProgress = TuringMachine.Backend.Server.Models.Progresses.Progress;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.DbProgressInteractions
{
    internal static class DbLevelProgressInteraction
    {
        public static ServerResponse<ResponseProgress> GetProgress(string uuid, byte levelID , DataContext db)
        {
            using IEnumerator<DbProgressManagement.Progress> progress = db.Progresses
                .Where(progress => progress.LevelID == levelID && progress.UUID == Guid.Parse(uuid))
                .GetEnumerator();
            
            if (!progress.MoveNext()) 
                return ServerResponse.StartTracing<ResponseProgress>(nameof(GetProgress), NO_SUCH_ITEM);
            
            DbProgressManagement.Progress dbProgress = progress.Current;
            
            if (progress.MoveNext())
                return ServerResponse.StartTracing<ResponseProgress>(nameof(GetProgress), DUPLICATED_ITEM);

            ResponseProgress responseProgress = new ResponseProgress{
                UUID = dbProgress.UUID,
                LevelID = dbProgress.LevelID,
                SubmittedTime = dbProgress.SubmittedTime,
                DesignID = dbProgress.DesignID,
                IsSolved = dbProgress.IsSolved,
            };
            
            return new ServerResponse<ResponseProgress>(SUCCESS, responseProgress);
        }

        public static async Task<ServerResponse<ICollection<ResponseProgress>>> GetAllProgressAsync(DataContext db)
        {
            var progresses = await db.Progresses
                .Select(p => new ResponseProgress
                {
                    UUID = p.UUID,
                    LevelID = p.LevelID,
                    SubmittedTime = p.SubmittedTime,
                    DesignID = p.DesignID,
                    IsSolved = p.IsSolved,
                }).ToListAsync();
            
            return progresses.Count == 0
                ? ServerResponse.StartTracing<ICollection<ResponseProgress>>(nameof(GetAllProgressAsync) , NO_SUCH_ITEM)
                : new ServerResponse<ICollection<ResponseProgress>>(SUCCESS , progresses);
        }
    }
    
    
}