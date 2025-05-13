using System.Diagnostics;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.MachineDesigns;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbHead = TuringMachine.Backend.Server.Database.Entity.MachineStorage.Head;

using ResponseHead = TuringMachine.Backend.Server.Models.MachineDesigns.Head;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.DbMachineInteraction
{
    internal class DbHeadInteraction
    {
        /// <returns>
        ///     Return a list of machine heads when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "TOO_MUCH_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<IList<ResponseHead>> GetHeads(string machineID , DataContext db)
        {
            List<ResponseHead> responseHeads = new List<ResponseHead>();

            if (responseHeads.Count > short.MaxValue)
                return ServerResponse.StartTracing<IList<ResponseHead>>(nameof(GetHeads) , TOO_MUCH_ITEM);

            foreach (DbHead dbHead in db.Heads.Where(head => head.MachineID == Guid.Parse(machineID)))
            {
                HeadType headType;
                switch (dbHead.IsReadable , dbHead.IsWriteable)
                {
                    case (true , true):   headType = HeadType.ReadWrite; break;
                    case (true , false):  headType = HeadType.Read; break;
                    case (false , true):  headType = HeadType.Write; break;
                    case (false , false): return ServerResponse.StartTracing<IList<ResponseHead>>(nameof(GetHeads) , BACKEND_ERROR);
                }

                responseHeads.Add(
                    new ResponseHead
                    {
                        TapeID         = dbHead.TapeID ,
                        Position       = dbHead.Position ,
                        Type           = headType ,
                    }
                );
            }

            if (responseHeads.Count == 0)
                return ServerResponse.StartTracing<IList<ResponseHead>>(nameof(GetHeads) , NO_SUCH_ITEM);

            return new ServerResponse<IList<ResponseHead>>(SUCCESS , responseHeads);
        }

        /// <returns>
        ///     Insert a list of machine heads when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "TOO_MUCH_ITEM".
        /// </returns>
        public static ServerResponse InsertHeads(string machineID , ICollection<ResponseHead> heads , DataContext db)
        {
            if (heads.Count > short.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertHeads) , TOO_MUCH_ITEM);

            foreach (ResponseHead head in heads)
                db.Heads.Add(
                    new DbHead
                    {
                        MachineID = Guid.Parse(machineID) ,
                        TapeID    = head.TapeID ,
                        Position  = head.Position ,

                        IsReadable  = head.Type is (HeadType.Read or HeadType.ReadWrite) ,
                        IsWriteable = head.Type is (HeadType.Write or HeadType.ReadWrite) ,
                    }
                );

            return new ServerResponse(SUCCESS);
        }

        /// <returns>
        ///     Delete a list of machine heads when "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static ServerResponse DeleteHeads(string machineID , DataContext db)
        {
            foreach (DbHead head in db.Heads.Where(head => head.MachineID == Guid.Parse(machineID)))
                db.Heads.Remove(head);

            return new ServerResponse(SUCCESS);
        }
    }
}
