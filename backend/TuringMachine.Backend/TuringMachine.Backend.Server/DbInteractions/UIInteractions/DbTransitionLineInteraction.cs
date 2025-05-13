using System.Buffers;
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
                int count = v.StepX.Length / sizeof(float);
                float[] stepX = ArrayPool<float>.Shared.Rent(count);
                float[] stepY = ArrayPool<float>.Shared.Rent(count);
                
                Buffer.BlockCopy(v.StepX , 0 , stepX , 0 , v.StepX.Length);
                Buffer.BlockCopy(v.StepY , 0 , stepY , 0 , v.StepY.Length);
                
                Vector2<float>[] steps = new Vector2<float>[count];
                for (int i = 0; i < count; i++)
                {
                    steps[i] = new Vector2<float>
                    {
                        X = stepX[i] ,
                        Y = stepY[i]
                    };
                }
                
                ArrayPool<float>.Shared.Return(stepX);
                ArrayPool<float>.Shared.Return(stepY);
                
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
                int count = v.Steps.Count;
                
                float[] rawStepX = ArrayPool<float>.Shared.Rent(count);
                float[] rawStepY = ArrayPool<float>.Shared.Rent(count);

                for (int i = 0; i < count; i++)
                {
                    rawStepX[i] = v.Steps[i].X;
                    rawStepY[i] = v.Steps[i].Y;
                }

                byte[] stepX = new byte[v.Steps.Count * sizeof(float)];
                byte[] stepY = new byte[v.Steps.Count * sizeof(float)];
                
                Buffer.BlockCopy(rawStepX , 0 , stepX , 0 , stepX.Length);
                Buffer.BlockCopy(rawStepY , 0 , stepY , 0 , stepY.Length);
                
                ArrayPool<float>.Shared.Return(rawStepX);
                ArrayPool<float>.Shared.Return(rawStepY);

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