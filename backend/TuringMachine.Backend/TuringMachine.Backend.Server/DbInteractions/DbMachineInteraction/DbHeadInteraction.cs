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
        public static ServerResponse<IList<ResponseHead>> GetHead(string machineID , DataContext db)
        {
            List<ResponseHead> responseHeads = new List<ResponseHead>();
            foreach (DbHead dbHead in db.Heads.Where(head => head.MachineID == Guid.Parse(machineID)))
            {
                HeadType headType;
                switch (dbHead.IsReadable , dbHead.IsWriteable)
                {
                    case (true , true):   headType = HeadType.ReadWrite; break;
                    case (true , false):  headType = HeadType.Read; break;
                    case (false , true):  headType = HeadType.Write; break;
                    case (false , false): return ServerResponse.StartTracing<IList<ResponseHead>>(nameof(GetHead) , FAILURE);
                }

                responseHeads.Add(
                    new ResponseHead
                    {
                        HeadOrderIndex = dbHead.HeadIndex ,
                        TapeID         = dbHead.TapeID ,
                        Position       = dbHead.Position ,
                        Type           = headType ,
                    }
                );
            }

            return new ServerResponse<IList<ResponseHead>>(SUCCESS , responseHeads);
        }

        public static ServerResponse InsertHead(string machineID , IList<ResponseHead> head , DataContext db)
        {
            if (head.Count > short.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertHead) , BACKEND_ERROR);

            for (byte i = 0; i < head.Count; i++)
                db.Heads.Add(
                    new DbHead
                    {
                        MachineID = Guid.Parse(machineID) ,
                        HeadIndex = i ,
                        TapeID    = head[i].TapeID ,
                        Position  = head[i].Position ,

                        IsReadable  = head[i].Type is (HeadType.Read or HeadType.ReadWrite) ,
                        IsWriteable = head[i].Type is (HeadType.Write or HeadType.ReadWrite) ,
                    }
                );

            return new ServerResponse(SUCCESS);
        }

        public static ServerResponse DeleteHead(string machineID , DataContext db)
        {
            foreach (DbHead head1 in db.Heads.Where(head => head.MachineID == Guid.Parse(machineID)))
                db.Heads.Remove(head1);

            return new ServerResponse(SUCCESS);
        }
    }
}
