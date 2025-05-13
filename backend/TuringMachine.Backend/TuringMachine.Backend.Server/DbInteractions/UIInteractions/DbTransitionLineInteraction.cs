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
                int byteSize = Buffer.ByteLength(v.StepX);
                int count = v.StepX.Length / sizeof(double);
                double[] stepX = new double[count];
                double[] stepY = new double[count];
                
                Buffer.BlockCopy(v.StepX , 0 , stepX , 0 , byteSize);
                Buffer.BlockCopy(v.StepY , 0 , stepY , 0 , byteSize);
                
                Vector2<double>[] steps = new Vector2<double>[count];
                for (int i = 0; i < count; i++)
                {
                    steps[i] = new Vector2<double>
                    {
                        X = stepX[i] ,
                        Y = stepY[i]
                    };
                }
                
                return new TransitionLine
                {
                    Source = new Vector2<double>
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
                double[] rawStepX = new double[count];
                double[] rawStepY = new double[count];

                for (int i = 0; i < count; i++)
                {
                    rawStepX[i] = v.Steps[i].X;
                    rawStepY[i] = v.Steps[i].Y;
                }

                int byteSize = Buffer.ByteLength(rawStepX);
                byte[] stepX = new byte[byteSize];
                byte[] stepY = new byte[byteSize];
                
                Buffer.BlockCopy(rawStepX , 0 , stepX , 0 , byteSize);
                Buffer.BlockCopy(rawStepY , 0 , stepY , 0 , byteSize);

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