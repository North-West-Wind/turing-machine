using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Database.Entity.UILabels;
using TuringMachine.Backend.Server.Models.UserInterface;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

namespace TuringMachine.Backend.Server.DbInteractions.UIInteractions
{
    internal class DbNodeInteraction
    {
        public static ServerResponse<IList<Node>> GetNode(string labelUUID , DataContext db)
        {
            List<Node> nodes = db.Nodes
                .Where(v => v.UILabelID == Guid.Parse(labelUUID))
                .Select(v => new Node
                {
                    NodeID  = v.NodeID ,
                    X       = v.X ,
                    Y       = v.Y ,
                    IsFinal = v.IsFinal
                }).ToList();
            
            return new ServerResponse<IList<Node>>(SUCCESS , nodes);
        }
        
        public static ServerResponse InsertNode(string labelUUID , IEnumerable<Node> nodes , DataContext db)
        {
            Guid id = Guid.Parse(labelUUID);
            db.Nodes.AddRange(nodes.Select(v => new NodeLabel
            {
                UILabelID = id ,
                NodeID    = v.NodeID ,
                X         = v.X ,
                Y         = v.Y ,
                IsFinal   = v.IsFinal
            }));
            
            return new ServerResponse(SUCCESS);
        }

        public static ServerResponse DeleteNode(string labelUUID , DataContext db)
        {
            db.Nodes.RemoveRange(db.Nodes.Where(v => v.UILabelID == Guid.Parse(labelUUID)));
            return new ServerResponse(SUCCESS);
        }
    }
}