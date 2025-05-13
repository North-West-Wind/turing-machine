using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

using ResponseTextLabel = TuringMachine.Backend.Server.Models.UserInterface.TextLabel;
using DbTextLabel = TuringMachine.Backend.Server.Database.Entity.UILabels.TextLabel;

namespace TuringMachine.Backend.Server.DbInteractions.UIInteractions
{
    internal class DbTextInteraction
    {
        public static ServerResponse<IList<ResponseTextLabel>> GetTextLabel(string labelUUID , DataContext db)
        {
            List<ResponseTextLabel> boxes = db.Texts
                .Where(v => v.UILabelID == Guid.Parse(labelUUID))
                .Select(v => new ResponseTextLabel
                {
                    X     = v.X ,
                    Y     = v.Y ,
                    Value = v.Value
                }).ToList();
            
            return new ServerResponse<IList<ResponseTextLabel>>( SUCCESS, boxes);
        }

        public static ServerResponse InsertTextLabel(string labelUUID , IList<ResponseTextLabel> texts , DataContext db)
        {
            if (texts.Count > short.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertTextLabel) , BACKEND_ERROR);
            
            Guid id = Guid.Parse(labelUUID);
            for (int index = 0; index < texts.Count; index++)
            {
                db.Texts.Add(new DbTextLabel
                {
                    UILabelID = id ,
                    X         = texts[index].X ,
                    Y         = texts[index].Y ,
                    Value     = texts[index].Value ,
                    TextIndex = (short)index ,
                });
            }
            
            return new ServerResponse(SUCCESS);
        }

        public static ServerResponse DeleteTextLabel(string labelUUID , DataContext db)
        {
            db.RemoveRange(db.Texts.Where(v => v.UILabelID == Guid.Parse(labelUUID)));
            return new ServerResponse(SUCCESS);
        }
    }
}