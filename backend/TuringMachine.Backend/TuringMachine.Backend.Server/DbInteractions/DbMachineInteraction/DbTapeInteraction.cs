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
        public static ServerResponse<IList<ResponseTape?>> GetTapes(string designID , DataContext db)
        {
            IQueryable<DbTape> dbTapes       = db.TapeInfos.Where(tape => tape.DesignID == Guid.Parse(designID));
            ResponseTape?[]    responseTapes = new ResponseTape?[dbTapes.Count()];

            foreach (DbTape dbTape in dbTapes)
            {
                responseTapes[dbTape.TapeIndex] = new ResponseTape
                {
                    Type          = dbTape.TapeType ,
                    InitialValues = dbTape.InitialValues ,
                };
            }
            return new ServerResponse<IList<ResponseTape?>>(SUCCESS , responseTapes);
        }

        
        public static ServerResponse InsertTapes(string designID , IList<ResponseTape> tape , DataContext db)
        {
            for (short i = 0; i < tape.Count; i++)
            {
                db.TapeInfos.Add(
                    new DbTape
                    {
                        DesignID      = Guid.Parse(designID) ,
                        TapeIndex     = i ,
                        TapeType      = tape[i].Type ,
                        InitialValues = tape[i].InitialValues ,
                    }
                );
            }
            return new ServerResponse(SUCCESS);
        }


        public static ServerResponse DeleteTapes(string designID , DataContext db)
        {
            db.TapeInfos.RemoveRange(
                db.TapeInfos.Where(tape => tape.DesignID == Guid.Parse(designID))
            );
            return new ServerResponse(SUCCESS);
        }
    }
}
