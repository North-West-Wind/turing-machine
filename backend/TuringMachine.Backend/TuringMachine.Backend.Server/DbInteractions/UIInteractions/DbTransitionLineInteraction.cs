using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.UserInterface;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

using DbTransitionLine = TuringMachine.Backend.Server.Database.Entity.UILabels.TransitionLine;

namespace TuringMachine.Backend.Server.DbInteractions.UIInteractions
{
    internal class DbTransitionLineInteraction
    {
        public static ServerResponse<IList<TransitionLine>> GetTransitionLine(string labelUUID , DataContext db)
        {
            IEnumerable<DbTransitionLine> dbTransitions = db.TransitionLines
                .Where(v => v.UILabelID == Guid.Parse(labelUUID))
                .AsEnumerable();
            
            List<TransitionLine> lines = dbTransitions.Select(v =>
            {
                List<Vector2<byte>> steps = new List<Vector2<byte>>(v.StepX.Length);
                for (int i = 0; i < v.StepX.Length; i++)
                {
                    steps.Add(new Vector2<byte>
                    {
                        X = v.StepX[i] ,
                        Y = v.StepY[i]
                    });
                }
                
                return new TransitionLine
                {
                    Source = new Vector2<float>
                    {
                        X = v.SourceX ,
                        Y = v.SourceY
                    } ,
                    Steps = steps
                };
            }).ToList();
            
            return new ServerResponse<IList<TransitionLine>>(ResponseStatus.SUCCESS , lines);
        }
        
        public static ServerResponse InsertTransitionLine(string labelUUID , IEnumerable<TransitionLine> lines , DataContext db)
        {
            Guid id = Guid.Parse(labelUUID);
            db.TransitionLines.AddRange(lines.Select(v =>
            {
                byte[] stepX = new byte[v.Steps.Count];
                byte[] stepY = new byte[v.Steps.Count];

                for (int i = 0; i < v.Steps.Count; i++)
                {
                    stepX[i] = v.Steps[i].X;
                    stepY[i] = v.Steps[i].Y;
                }

                return new DbTransitionLine
                {
                    UILabelID = id ,
                    SourceX   = v.Source.X ,
                    SourceY   = v.Source.Y ,
                    StepX     = stepX ,
                    StepY     = stepY
                };
            }));
            
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        public static ServerResponse DeleteTransitionLine(string labelUUID , DataContext db)
        {
            db.RemoveRange(db.TransitionLines.Where(v => v.UILabelID == Guid.Parse(labelUUID)));
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
    }
}