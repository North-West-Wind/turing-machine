using System.Numerics;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

#region Type Alias
// @formatter:off
using DbMachineLabel = TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels.MachineLabel;
using DbMachineBoxLabel = TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels.MachineBoxLabel;
using DbMachineTextLabel = TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels.TextLabel;
using DbMachineNodeLabel = TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels.NodeLabel;

using ResponseMachineLabel = TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels.MachineLabel;
using ResponseMachineBoxLabel = TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels.MachineBoxLabel;
using ResponseMachineTextLabel = TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels.MachineTextLabel;
using ResponseMachineNodeLabel = TuringMachine.Backend.Server.Models.Machines.UI.MachineLabels.MachineNodeLabel;
// @formatter:on
#endregion

namespace TuringMachine.Backend.Server.DbInteraction.UiLabels
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
            
            if (!machineLabels.MoveNext()) return new ServerResponse<ResponseMachineLabel>(ResponseStatus.NO_SUCH_ITEM)   ;             DbMachineLabel dbMachineLabel = machineLabels.Current;
            if ( machineLabels.MoveNext()) return new ServerResponse<ResponseMachineLabel>(ResponseStatus.DUPLICATED_ITEM); // @formatter:on

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
                    Start = new Vector2 { X = dbMachineBoxLabel.StartX , Y = dbMachineBoxLabel.StartY } ,
                    Size  = new Vector2 { X = dbMachineBoxLabel.Width , Y  = dbMachineBoxLabel.Height } ,
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
                    Position = new Vector2 { X = dbMachineTextLabel.PosX , Y = dbMachineTextLabel.PosY } ,
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
                    Position = new Vector2 { X = dbMachineNodeLabel.PosX , Y = dbMachineNodeLabel.PosY } ,
                    Label    = dbMachineNodeLabel.Label ,
                    IsFinal  = dbMachineNodeLabel.IsFinal ,
                };
            }

            return new ServerResponse<ResponseMachineLabel>(
                ResponseStatus.SUCCESS , new ResponseMachineLabel
                {
                    Title = dbMachineLabel.Title ,
                    Color = dbMachineLabel.Color ,
                    Boxes = responseMachineBoxLabels ,
                    Texts = responseMachineTextLabels ,
                    Nodes = responseMachineNodeLabels ,
                }
            );
        }

        /// <returns>
        ///     When successfully inserted a set of machine labels, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static async Task<ServerResponse> InsertMachineLabelAsync(ResponseMachineLabel machineLabel , string machineID , DataContext db)
        {
            DbMachineLabel dbMachineLabel = new DbMachineLabel
            {
                MachineLabelID = Guid.NewGuid() ,
                MachineID      = Guid.Parse(machineID) ,
                Title          = machineLabel.Title ,
                Color          = machineLabel.Color ,
            };
            await db.MachineLabels.AddAsync(dbMachineLabel);
            string machineLabelID = dbMachineLabel.MachineLabelID.ToString();

            for (byte i = 0; i < machineLabel.Boxes.Count; i++)
                dbMachineLabel.BoxLabels.Add(
                    new DbMachineBoxLabel
                    {
                        MachineLabelID = Guid.Parse(machineLabelID) ,
                        StartX         = machineLabel.Boxes[i].Start.X ,
                        StartY         = machineLabel.Boxes[i].Start.Y ,
                        Width          = machineLabel.Boxes[i].Size.X ,
                        Height         = machineLabel.Boxes[i].Size.Y ,
                        Color          = machineLabel.Boxes[i].Color ,
                        LabelIndex     = i ,
                    }
                );

            for (byte i = 0; i < machineLabel.Texts.Count; i++)
                dbMachineLabel.TextLabels.Add(
                    new DbMachineTextLabel
                    {
                        MachineLabelID = Guid.Parse(machineLabelID) ,
                        PosX           = machineLabel.Texts[i].Position.X ,
                        PosY           = machineLabel.Texts[i].Position.Y ,
                        Value          = machineLabel.Texts[i].Value ,
                        LabelIndex     = i ,
                    }
                );

            for (byte i = 0; i < machineLabel.Nodes.Count; i++)
                dbMachineLabel.NodeLabels.Add(
                    new DbMachineNodeLabel
                    {
                        PosX       = machineLabel.Nodes[i].Position.X ,
                        PosY       = machineLabel.Nodes[i].Position.Y ,
                        Label      = machineLabel.Nodes[i].Label ,
                        IsFinal    = machineLabel.Nodes[i].IsFinal ,
                        LabelIndex = i ,
                    }
                );

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
    }
}
