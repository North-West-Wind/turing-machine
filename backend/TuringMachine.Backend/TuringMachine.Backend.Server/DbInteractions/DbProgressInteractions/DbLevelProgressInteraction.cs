using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

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
            IEnumerator<DbProgressManagement.Progress> progress = db.Progresses
                .Where(progress => progress.LevelID == levelID && progress.UUID == Guid.Parse(uuid))
                .GetEnumerator();
            
            if (!progress.MoveNext()) 
                return ServerResponse.StartTracing<ResponseProgress>(nameof(GetProgress), ResponseStatus.NO_SUCH_ITEM);
            
            DbProgressManagement.Progress dbProgress = progress.Current;
            
            if (progress.MoveNext())
                return ServerResponse.StartTracing<ResponseProgress>(nameof(GetProgress), ResponseStatus.DUPLICATED_ITEM);

            ResponseProgress responseProgress = new ResponseProgress{
                UUID = dbProgress.UUID,
                LevelID = dbProgress.LevelID,
                SubmittedTime = dbProgress.SubmittedTime,
                DesignID = dbProgress.DesignID,
                IsSolved = dbProgress.IsSolved,
            };
            
            return new ServerResponse<ResponseProgress>(ResponseStatus.SUCCESS, responseProgress);
        }
    }
    
    
}