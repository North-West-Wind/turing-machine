using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Database.Entity.UILabels;
using TuringMachine.Backend.Server.Models.UserInterface;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

namespace TuringMachine.Backend.Server.DbInteractions.UIInteractions
{
    internal class DbHighlightBoxInteraction
    {
        public static ServerResponse<IList<HighlightBox>> GetHighlightBox(string labelUUID , DataContext db)
        {
            List<HighlightBox> boxes = db.HighlightBoxes
                .Where(v => v.UILabelID == Guid.Parse(labelUUID))
                .Select(v => new HighlightBox()
                {
                    X      = v.X ,
                    Y      = v.Y ,
                    Width  = v.Width ,
                    Height = v.Height ,
                    Color  = v.Color ,
                    Title  = v.Title
                }).ToList();
            
            return new ServerResponse<IList<HighlightBox>>(SUCCESS, boxes);
        }
        
        public static ServerResponse InsertHighlightBox(string labelUUID , IList<HighlightBox> boxes , DataContext db)
        {
            if (boxes.Count > short.MaxValue)
                return ServerResponse.StartTracing(nameof(InsertHighlightBox) , BACKEND_ERROR);
            
            Guid id = Guid.Parse(labelUUID);
            for (int index = 0; index < boxes.Count; index++)
            {
                db.HighlightBoxes.Add(new HighlightBoxesLabel
                {
                    UILabelID = id ,
                    X         = boxes[index].X ,
                    Y         = boxes[index].Y ,
                    Title     = boxes[index].Title,
                    BoxIndex  = (short)index ,
                    Width     = boxes[index].Width,
                    Height    = boxes[index].Height,
                    Color     = boxes[index].Color,
                });
            }
            
            return new ServerResponse(SUCCESS);
        }

        public static ServerResponse DeleteHighlightBox(string labelUUID , DataContext db)
        {
            db.RemoveRange(db.HighlightBoxes.Where(v => v.UILabelID == Guid.Parse(labelUUID)));
            return new ServerResponse(SUCCESS);
        }
    }
}