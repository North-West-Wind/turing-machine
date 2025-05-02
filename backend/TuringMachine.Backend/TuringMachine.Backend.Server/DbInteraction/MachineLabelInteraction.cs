using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

#region Type Alias
// @formatter:off
using DbMachineLabel     = TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels.MachineLabel;
using DbMachineBoxLabel  = TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels.MachineBoxLabel;
using DbMachineTextLabel = TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels.TextLabel;
using DbMachineNodeLabel = TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels.NodeLabel;

using ResponseMachineLabel     = TuringMachine.Backend.Server.Models.Machines.UI.MachineLabel;
using ResponseMachineBoxLabel  = TuringMachine.Backend.Server.Models.Machines.UI.MachineBoxLabel;
using ResponseMachineTextLabel = TuringMachine.Backend.Server.Models.Machines.UI.MachineTextLabel;
using ResponseMachineNodeLabel = TuringMachine.Backend.Server.Models.Machines.UI.MachineNodeLabel;
// @formatter:on
#endregion

namespace TuringMachine.Backend.Server.DbInteraction
{
    internal static class MachineLabelInteraction
    {
        /// <returns>
        ///     Return a complete set of labels for one machine when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "MACHINE_NOT_FOUND", "DUPLICATED_MACHINE_LABEL" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ResponseMachineLabel> GetMachineLabel(string machineID , DataContext db)
        {
// @formatter:off
            using IEnumerator<DbMachineLabel> machineLabels = db.MachineLabels.Where(label => label.MachineID.ToString() == machineID)
                                                                              .Include(machineLabel => machineLabel.BoxLabels )
                                                                              .Include(machineLabel => machineLabel.TextLabels)
                                                                              .Include(machineLabel => machineLabel.NodeLabels)
                                                                              .GetEnumerator();
            
            if (!machineLabels.MoveNext()) { return new ServerResponse<ResponseMachineLabel>(ResponseStatus.NO_SUCH_ITEM)   ; }
            DbMachineLabel dbMachineLabel = machineLabels.Current;
            if ( machineLabels.MoveNext()) { return new ServerResponse<ResponseMachineLabel>(ResponseStatus.DUPLICATED_ITEM); }
// @formatter:on

            ResponseMachineBoxLabel[] responseMachineBoxLabels = new ResponseMachineBoxLabel[dbMachineLabel.BoxLabels.Count];
            foreach (DbMachineBoxLabel dbMachineBoxLabel in dbMachineLabel.BoxLabels)
            {
                int index = dbMachineBoxLabel.LabelIndex;
                if (index >= dbMachineLabel.BoxLabels.Count)
                    return new ServerResponse<ResponseMachineLabel>(ResponseStatus.BACKEND_ERROR);

// ReSharper disable once ConditionIsAlwaysTrueOrFalseAccordingToNullableAPIContract
                if (responseMachineBoxLabels[index] is not null)                                     // If the element is not initialised, it will be null.
                    return new ServerResponse<ResponseMachineLabel>(ResponseStatus.DUPLICATED_ITEM); // if the element is assigned before, return "DUPLICATED_ITEM" to indicate error.

                responseMachineBoxLabels[index] = new ResponseMachineBoxLabel
                {
                    Start = new Point { X = dbMachineBoxLabel.StartX , Y = dbMachineBoxLabel.StartY } ,
                    Size  = new Point { X = dbMachineBoxLabel.Width , Y  = dbMachineBoxLabel.Height } ,
                    Color = dbMachineBoxLabel.Color ,
                };
            }

            ResponseMachineTextLabel[] responseMachineTextLabels = new ResponseMachineTextLabel[dbMachineLabel.TextLabels.Count];
            foreach (DbMachineTextLabel dbMachineTextLabel in dbMachineLabel.TextLabels)
            {
                int index = dbMachineTextLabel.LabelIndex;
                if (index >= dbMachineLabel.TextLabels.Count)
                    return new ServerResponse<ResponseMachineLabel>(ResponseStatus.BACKEND_ERROR);

// ReSharper disable once ConditionIsAlwaysTrueOrFalseAccordingToNullableAPIContract
                if (responseMachineTextLabels[index] is not null)                                    // If the element is not initialised, it will be null.
                    return new ServerResponse<ResponseMachineLabel>(ResponseStatus.DUPLICATED_ITEM); // if the element is assigned before, return "DUPLICATED_ITEM" to indicate error.

                responseMachineTextLabels[index] = new ResponseMachineTextLabel
                {
                    Position = new Point { X = dbMachineTextLabel.PosX , Y = dbMachineTextLabel.PosY } ,
                    Value    = dbMachineTextLabel.Value ,
                };
            }

            ResponseMachineNodeLabel[] responseMachineNodeLabels = new ResponseMachineNodeLabel[dbMachineLabel.NodeLabels.Count];
            foreach (DbMachineNodeLabel dbMachineNodeLabel in dbMachineLabel.NodeLabels)
            {
                int index = dbMachineNodeLabel.LabelIndex;
                if (index >= dbMachineLabel.NodeLabels.Count)
                    return new ServerResponse<ResponseMachineLabel>(ResponseStatus.BACKEND_ERROR);


// ReSharper disable once ConditionIsAlwaysTrueOrFalseAccordingToNullableAPIContract
                if (responseMachineNodeLabels[index] is not null)                                    // If the element is not initialised, it will be null.
                    return new ServerResponse<ResponseMachineLabel>(ResponseStatus.DUPLICATED_ITEM); // if the element is assigned before, return "DUPLICATED_ITEM" to indicate error.

                responseMachineNodeLabels[index] = new ResponseMachineNodeLabel
                {
                    Position = new Point { X = dbMachineNodeLabel.PosX , Y = dbMachineNodeLabel.PosY } ,
                    Label    = dbMachineNodeLabel.Label ,
                };
            }

            return new ServerResponse<ResponseMachineLabel>(
                ResponseStatus.SUCCESS , new ResponseMachineLabel
                {
                    Title = dbMachineLabel.Title ,
                    Boxes = responseMachineBoxLabels ,
                    Texts = responseMachineTextLabels ,
                    Nodes = responseMachineNodeLabels ,
                }
            );
        }
    }
}
