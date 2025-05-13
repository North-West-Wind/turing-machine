using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbTape = TuringMachine.Backend.Server.Database.Entity.MachineStorage.TapeInfo;

using ResponseTape = TuringMachine.Backend.Server.Models.MachineDesigns.Tape;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.DbMachineInteraction
{
    internal class DbTapeInteraction
    {
        /// <returns>
        ///     Return a list of tapes when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<IList<ResponseTape?>> GetTapes(string designID , DataContext db)
        {
            IQueryable<DbTape> dbTapes       = db.TapeInfos.Where(tape => tape.DesignID == Guid.Parse(designID));
            ResponseTape?[]    responseTapes = new ResponseTape?[dbTapes.Count()];

            if (!dbTapes.Any())
                return ServerResponse.StartTracing<IList<ResponseTape?>>(nameof(GetTapes) , NO_SUCH_ITEM);

            foreach (DbTape dbTape in dbTapes)
                responseTapes[dbTape.TapeIndex] = new ResponseTape
                {
                    Type          = dbTape.TapeType ,
                    InitialValues = dbTape.InitialValues ,
                };

            return new ServerResponse<IList<ResponseTape?>>(SUCCESS , responseTapes);
        }

        /// <returns>
        ///     Insert a list of tapes when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "TOO_MUCH_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse InsertTapes(string designID , IList<ResponseTape> tapes , DataContext db)
        {
            if (tapes.Count > byte.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertTapes) , TOO_MUCH_ITEM);

            for (short i = 0; i < tapes.Count; i++)
                db.TapeInfos.Add(
                    new DbTape
                    {
                        DesignID      = Guid.Parse(designID) ,
                        TapeIndex     = i ,
                        TapeType      = tapes[i].Type ,
                        InitialValues = tapes[i].InitialValues ,
                    }
                );

            return new ServerResponse(SUCCESS);
        }

        /// <returns>
        ///     Delete a list of tapes statement when "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static ServerResponse DeleteTapes(string designID , DataContext db)
        {
            db.TapeInfos.RemoveRange(
                db.TapeInfos.Where(tape => tape.DesignID == Guid.Parse(designID))
            );
            return new ServerResponse(SUCCESS);
        }
    }
}
