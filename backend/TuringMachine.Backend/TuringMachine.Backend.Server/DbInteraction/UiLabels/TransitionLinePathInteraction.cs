using System.Numerics;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Database.Entity.UiLabels;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

#region Type Alias
using DbTransitionLinePath = TuringMachine.Backend.Server.Database.Entity.UiLabels.TransitionLinePath;
#endregion

namespace TuringMachine.Backend.Server.DbInteraction.UiLabels
{
    internal static class TransitionLinePathInteraction
    {
        /// <returns>
        ///     Returns a list of steps, for drawing transition lines, when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<IList<Point>> GetTransitionLinePath(string transitionID , DataContext db)
        {
            using IEnumerator<DbTransitionLinePath> rawPaths = db.TransitionLinePath.Where(path => path.TransitionID.ToString() == transitionID).GetEnumerator();
            if (!rawPaths.MoveNext()) return ServerResponse.StartTracing<IList<Point>>(nameof(GetTransitionLinePath) , ResponseStatus.NO_SUCH_ITEM);
            DbTransitionLinePath rawPath = rawPaths.Current;
            if (rawPaths.MoveNext()) return ServerResponse.StartTracing<IList<Point>>(nameof(GetTransitionLinePath) , ResponseStatus.DUPLICATED_ITEM);

            // check if the path has the valid format
            if (rawPath.PathX.Length != rawPath.PathY.Length) return ServerResponse.StartTracing<IList<Point>>(nameof(GetTransitionLinePath) , ResponseStatus.BACKEND_ERROR);
            (int pathSteps, int remainingBytes) = Math.DivRem(rawPath.PathX.Length , 4);
            if (remainingBytes != 0) return ServerResponse.StartTracing<IList<Point>>(nameof(GetTransitionLinePath) , ResponseStatus.BACKEND_ERROR);

            // cast 2 float arrays to Point (2D) array
            float[] pathX = new float[pathSteps];
            float[] pathY = new float[pathSteps];
            Buffer.BlockCopy(rawPath.PathX , 0 , pathX , 0 , rawPath.PathX.Length);  // batch type casting for converting byte array to float array
            Buffer.BlockCopy(rawPath.PathY , 0 , pathY , 0 , rawPath.PathY.Length);
            Point[] offsetSteps = new Point[pathSteps];
            for (int i = 0; i < pathSteps; i++)
                offsetSteps[i] = new Point{ X = pathX[i] , Y = pathY[i]};

            return new ServerResponse<IList<Point>>(ResponseStatus.SUCCESS , offsetSteps);
        }

        /// <returns>
        ///     When successfully inserted a path for drawing transition line, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static ServerResponse InsertTransitionLinePath(string transitionID , IList<Point>? paths , DataContext db)
        {
            if (paths is null || paths.Count == 0)
                return new ServerResponse(ResponseStatus.SUCCESS);

            // Extracting X and Y steps from the Vector2 list
            float[] pathX = new float[paths.Count];
            float[] pathY = new float[paths.Count];
            for (int i = 0; i < paths.Count; i++)
                (pathX[i], pathY[i]) = ((float)paths[i].X!, (float)paths[i].Y!);

            // create a placeholder for the path
            DbTransitionLinePath dbTransitionLinePath = new DbTransitionLinePath
            {
                TransitionID = Guid.Parse(transitionID) ,
                PathX = new byte[paths.Count * sizeof(float)] ,
                PathY = new byte[paths.Count * sizeof(float)] ,
            };

            // batch type casting for converting float array to byte array
            Buffer.BlockCopy(pathX , 0 , dbTransitionLinePath.PathX , 0 , dbTransitionLinePath.PathX.Length);
            Buffer.BlockCopy(pathY , 0 , dbTransitionLinePath.PathY , 0 , dbTransitionLinePath.PathY.Length);

            db.TransitionLinePath.Add(dbTransitionLinePath);

            db.SaveChanges();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully deleted a list of transition line paths associated to a transition, return status "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "DUPLICATED_ITEM".
        /// </returns>
        public static async Task<ServerResponse> DeleteTransitionLinePathAsync(string transitionID , DataContext db)
        {
            using IEnumerator<DbTransitionLinePath> rawPaths = db.TransitionLinePath.Where(path => path.TransitionID.ToString() == transitionID).GetEnumerator();
            if (!rawPaths.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteTransitionLinePathAsync) , ResponseStatus.NO_SUCH_ITEM);
            DbTransitionLinePath rawPath = rawPaths.Current;
            if (rawPaths.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteTransitionLinePathAsync) , ResponseStatus.DUPLICATED_ITEM);

            db.TransitionLinePath.Remove(rawPath);

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
    }
}
