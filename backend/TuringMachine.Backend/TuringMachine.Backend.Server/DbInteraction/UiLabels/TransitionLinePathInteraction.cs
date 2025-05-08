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
        public static ServerResponse<IList<Vector2>> GetTransitionLinePath(string transitionID , DataContext db)
        {
            using IEnumerator<DbTransitionLinePath> rawPaths = db.TransitionLinePath.Where(path => path.TransitionID.ToString() == transitionID).GetEnumerator();
            if (!rawPaths.MoveNext())
                return new ServerResponse<IList<Vector2>>(ResponseStatus.NO_SUCH_ITEM);

            DbTransitionLinePath rawPath = rawPaths.Current;
            if (rawPaths.MoveNext())
                return new ServerResponse<IList<Vector2>>(ResponseStatus.DUPLICATED_ITEM);

            if (rawPath.PathX.Length != rawPath.PathY.Length)
                return new ServerResponse<IList<Vector2>>(ResponseStatus.BACKEND_ERROR);

            (int pathSteps , int remainingBytes) = Math.DivRem(rawPath.PathX.Length , 4);
            if (remainingBytes != 0)
                return new ServerResponse<IList<Vector2>>(ResponseStatus.BACKEND_ERROR);

            float[] pathX = new float[pathSteps];
            float[] pathY = new float[pathSteps];
            Buffer.BlockCopy(rawPath.PathX , 0 , pathX , 0 , rawPath.PathX.Length);  // batch type casting for converting byte array to float array
            Buffer.BlockCopy(rawPath.PathY , 0 , pathY , 0 , rawPath.PathY.Length);

            Vector2[] offsetSteps = new Vector2[pathSteps];
            for (int i = 0; i < pathSteps; i++)
                offsetSteps[i] = new Vector2(pathX[i] , pathY[i]);
            return new ServerResponse<IList<Vector2>>(ResponseStatus.SUCCESS , offsetSteps);
        }

        /// <returns>
        ///     When successfully inserted a path for drawing transition line, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static ServerResponse InsertTransitionLinePath(string transitionID , IList<Vector2> paths , DataContext db)
        {
            if (paths.Count == 0)
                return new ServerResponse(ResponseStatus.SUCCESS);

            float[] pathX = new float[paths.Count];
            float[] pathY = new float[paths.Count];
            for (int i = 0; i < paths.Count; i++)
                (pathX[i], pathY[i]) = (paths[i].X, paths[i].Y);

            DbTransitionLinePath dbTransitionLinePath = new DbTransitionLinePath
            {
                TransitionID = Guid.Parse(transitionID) ,
                PathX = new byte[paths.Count * sizeof(float)] ,
                PathY = new byte[paths.Count * sizeof(float)] ,
            };
            Buffer.BlockCopy(pathX , 0 , dbTransitionLinePath.PathX , 0 , dbTransitionLinePath.PathX.Length);  // batch type casting for converting float array to byte array
            Buffer.BlockCopy(pathY , 0 , dbTransitionLinePath.PathY , 0 , dbTransitionLinePath.PathY.Length);

            db.TransitionLinePath.Add(dbTransitionLinePath);
            db.SaveChanges();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
    }
}
