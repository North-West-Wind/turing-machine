using System.Numerics;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Database.Entity.UiLabels;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

namespace TuringMachine.Backend.Server.DbInteraction
{
    internal static class TransitionLinePathInteraction
    {
        /// <returns>
        ///     Returns a list of steps, for drawing transition lines, when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ICollection<Vector2>> GetTransitionLinePath(string transitionID , DataContext db)
        {
            using IEnumerator<TransitionLinePath> rawPaths = db.TransitionLinePath.Where(path => path.TransitionID.ToString() == transitionID).GetEnumerator();
            if (!rawPaths.MoveNext())
                return new ServerResponse<ICollection<Vector2>>(ResponseStatus.NO_SUCH_ITEM);

            TransitionLinePath rawPath = rawPaths.Current;
            if (rawPaths.MoveNext())
                return new ServerResponse<ICollection<Vector2>>(ResponseStatus.DUPLICATED_ITEM);

            if (rawPath.PathX.Length != rawPath.PathY.Length)
                return new ServerResponse<ICollection<Vector2>>(ResponseStatus.BACKEND_ERROR);

            (int pathSteps , int remainingBytes) = Math.DivRem(rawPath.PathX.Length , 4);
            if (remainingBytes != 0)
                return new ServerResponse<ICollection<Vector2>>(ResponseStatus.BACKEND_ERROR);

            float[] pathX = new float[pathSteps];
            float[] pathY = new float[pathSteps];
            Buffer.BlockCopy(rawPath.PathX , 0 , pathX , 0 , rawPath.PathX.Length);  // batch type casting for converting byte array to float array
            Buffer.BlockCopy(rawPath.PathY , 0 , pathY , 0 , rawPath.PathY.Length);

            Vector2[] offsetSteps = new Vector2[pathSteps];
            for (int i = 0; i < pathSteps; i++)
                offsetSteps[i] = new Vector2(pathX[i] , pathY[i]);
            return new ServerResponse<ICollection<Vector2>>(ResponseStatus.SUCCESS , offsetSteps);
        }
    }
}
