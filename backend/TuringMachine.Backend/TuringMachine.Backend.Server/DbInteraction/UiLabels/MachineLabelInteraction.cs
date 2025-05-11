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
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM", "DESIGN_NOT_FOUND", "DUPLICATED_MACHINE_LABEL" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ResponseMachineLabel> GetMachineLabel(string machineID , DataContext db)  // TODO: extract common method
        {
// @formatter:off
            using IEnumerator<DbMachineLabel> machineLabels = db.MachineLabels.Where(label => label.MachineID.ToString() == machineID)
                                                                              .GetEnumerator();
// @formatter:on
            if (!machineLabels.MoveNext()) return new ServerResponse<ResponseMachineLabel>(ResponseStatus.NO_SUCH_ITEM);
            DbMachineLabel dbMachineLabel = machineLabels.Current;
            if (machineLabels.MoveNext()) return ServerResponse.StartTracing<ResponseMachineLabel>(nameof(GetMachineLabel) , ResponseStatus.DUPLICATED_ITEM);

            ServerResponse<IList<ResponseMachineBoxLabel>> getBoxLabelsResponse = GetMachineBoxLabels(dbMachineLabel.MachineLabelID.ToString() , db);
            if (getBoxLabelsResponse.Status is not ResponseStatus.SUCCESS)
                return getBoxLabelsResponse.WithThisTraceInfo<ResponseMachineLabel>(nameof(GetMachineLabel) , ResponseStatus.BACKEND_ERROR);

            ServerResponse<IList<ResponseMachineTextLabel>> getTextLabelsResponse = GetMachineTextLabels(dbMachineLabel.MachineLabelID.ToString() , db);
            if (getTextLabelsResponse.Status is not ResponseStatus.SUCCESS)
                return getTextLabelsResponse.WithThisTraceInfo<ResponseMachineLabel>(nameof(GetMachineLabel) , ResponseStatus.BACKEND_ERROR);

            ServerResponse<IList<ResponseMachineNodeLabel>> getNodeLabelsResponse = GetMachineNodeLabels(dbMachineLabel.MachineLabelID.ToString() , db);
            if (getNodeLabelsResponse.Status is not ResponseStatus.SUCCESS)
                return getNodeLabelsResponse.WithThisTraceInfo<ResponseMachineLabel>(nameof(GetMachineLabel) , ResponseStatus.BACKEND_ERROR);

            return new ServerResponse<ResponseMachineLabel>(
                ResponseStatus.SUCCESS , new ResponseMachineLabel
                {
                    Title = dbMachineLabel.Title ,
                    Color = dbMachineLabel.Color ,
                    Boxes = getBoxLabelsResponse.Result! ,
                    Texts = getTextLabelsResponse.Result! ,
                    Nodes = getNodeLabelsResponse.Result! ,
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

            if (machineLabel.Boxes is not null)
            {
                ServerResponse insertMachineBoxLabelsResponse = await InsertMachineBoxLabelsAsync(machineLabelID , machineLabel.Boxes , db);
                if (insertMachineBoxLabelsResponse.Status is not ResponseStatus.SUCCESS)
                    return insertMachineBoxLabelsResponse.WithThisTraceInfo(nameof(InsertMachineLabelAsync) , ResponseStatus.BACKEND_ERROR);
            }

            if (machineLabel.Texts is not null)
            {
                ServerResponse insertMachineTextLabelsResponse = await InsertMachineTextLabelsAsync(machineLabelID , machineLabel.Texts , db);
                if (insertMachineTextLabelsResponse.Status is not ResponseStatus.SUCCESS)
                    return insertMachineTextLabelsResponse.WithThisTraceInfo(nameof(InsertMachineLabelAsync) , ResponseStatus.BACKEND_ERROR);
            }

            if (machineLabel.Nodes is not null)
            {
                ServerResponse insertMachineNodeLabelsResponse = await InsertMachineNodeLabelsAsync(machineLabelID , machineLabel.Nodes , db);
                if (insertMachineNodeLabelsResponse.Status is not ResponseStatus.SUCCESS)
                    return insertMachineNodeLabelsResponse.WithThisTraceInfo(nameof(InsertMachineLabelAsync) , ResponseStatus.BACKEND_ERROR);
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }


        #region Helper Functions
        #region Get Machine Label Helper Functions
        /// <returns>
        ///     Return a complete set of box labels when "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static ServerResponse<IList<ResponseMachineBoxLabel>> GetMachineBoxLabels(string machineLabelID , DataContext db)
        {
            IQueryable<DbMachineBoxLabel> dbMachineBoxLabels = db.MachineBoxLabels.Where(label => label.MachineLabelID.ToString() == machineLabelID);

            if (!dbMachineBoxLabels.Any())
                return new ServerResponse<IList<ResponseMachineBoxLabel>>(ResponseStatus.SUCCESS);

            int maxSize = dbMachineBoxLabels.Max(label => label.LabelIndex) + 1;
            ResponseMachineBoxLabel[] responseMachineBoxLabels = new ResponseMachineBoxLabel[maxSize];
            foreach (DbMachineBoxLabel dbMachineBoxLabel in dbMachineBoxLabels)
            {
                responseMachineBoxLabels[dbMachineBoxLabel.LabelIndex] = new ResponseMachineBoxLabel();

                if (dbMachineBoxLabel.Width is null && dbMachineBoxLabel.Height is null && dbMachineBoxLabel.StartX is null && dbMachineBoxLabel.StartY is null && dbMachineBoxLabel.Color is null)
                    continue;

                responseMachineBoxLabels[dbMachineBoxLabel.LabelIndex].Color = dbMachineBoxLabel.Color;

                if (dbMachineBoxLabel.StartX is not null && dbMachineBoxLabel.StartY is not null)
                    responseMachineBoxLabels[dbMachineBoxLabel.LabelIndex]!.Start = new Point { X = (float)dbMachineBoxLabel.StartX , Y = (float)dbMachineBoxLabel.StartY };

                if (dbMachineBoxLabel.Width is not null && dbMachineBoxLabel.Height is not null)
                    responseMachineBoxLabels[dbMachineBoxLabel.LabelIndex]!.Size = new Point { X = (float)dbMachineBoxLabel.Width , Y = (float)dbMachineBoxLabel.Height };
            }

            return new ServerResponse<IList<ResponseMachineBoxLabel>>(ResponseStatus.SUCCESS , responseMachineBoxLabels);
        }

        /// <returns>
        ///     Return a complete set of text labels when "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static ServerResponse<IList<ResponseMachineTextLabel>> GetMachineTextLabels(string machineLabelID , DataContext db)
        {
            IQueryable<DbMachineTextLabel> dbMachineTextLabels = db.TextLabels.Where(label => label.MachineLabelID.ToString() == machineLabelID);

            if (!dbMachineTextLabels.Any())
                return new ServerResponse<IList<ResponseMachineTextLabel>>(ResponseStatus.SUCCESS);

            int maxSize = dbMachineTextLabels.Max(label => label.LabelIndex) + 1;
            ResponseMachineTextLabel[] responseMachineTextLabels = new ResponseMachineTextLabel[maxSize];
            foreach (DbMachineTextLabel dbMachineTextLabel in dbMachineTextLabels)
            {
                responseMachineTextLabels[dbMachineTextLabel.LabelIndex] = new ResponseMachineTextLabel();

                if (dbMachineTextLabel.Value is null && dbMachineTextLabel.PosX is null && dbMachineTextLabel.PosY is null)
                    continue;

                responseMachineTextLabels[dbMachineTextLabel.LabelIndex].Value = dbMachineTextLabel.Value;

                if (dbMachineTextLabel.PosX is not null && dbMachineTextLabel.PosY is not null)
                    responseMachineTextLabels[dbMachineTextLabel.LabelIndex]!.Position = new Point { X = (float)dbMachineTextLabel.PosX , Y = (float)dbMachineTextLabel.PosY };
            }

            return new ServerResponse<IList<ResponseMachineTextLabel>>(ResponseStatus.SUCCESS , responseMachineTextLabels);
        }

        /// <returns>
        ///     Return a complete set of node labels when "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static ServerResponse<IList<ResponseMachineNodeLabel>> GetMachineNodeLabels(string machineLabelID , DataContext db)
        {
            IQueryable<DbMachineNodeLabel> dbMachineNodeLabels = db.NodeLabels.Where(label => label.MachineLabelID.ToString() == machineLabelID);

            if (!dbMachineNodeLabels.Any())
                return new ServerResponse<IList<ResponseMachineNodeLabel>>(ResponseStatus.SUCCESS);

            int maxSize = dbMachineNodeLabels.Max(label => label.LabelIndex) + 1;
            ResponseMachineNodeLabel[] responseMachineNodeLabels = new ResponseMachineNodeLabel[maxSize];
            foreach (DbMachineNodeLabel dbMachineNodeLabel in dbMachineNodeLabels)
            {
                responseMachineNodeLabels[dbMachineNodeLabel.LabelIndex] = new ResponseMachineNodeLabel();

                if (dbMachineNodeLabel.Label is null && dbMachineNodeLabel.PosX is null && dbMachineNodeLabel.Label is null && dbMachineNodeLabel.IsFinal is null)
                    continue;

                responseMachineNodeLabels[dbMachineNodeLabel.LabelIndex].Label = dbMachineNodeLabel.Label;
                responseMachineNodeLabels[dbMachineNodeLabel.LabelIndex].IsFinal = dbMachineNodeLabel.IsFinal ?? false;

                if (dbMachineNodeLabel.PosX is not null && dbMachineNodeLabel.PosY is not null)
                    responseMachineNodeLabels[dbMachineNodeLabel.LabelIndex]!.Position = new Point { X = (float)dbMachineNodeLabel.PosX , Y = (float)dbMachineNodeLabel.PosY };
            }

            return new ServerResponse<IList<ResponseMachineNodeLabel>>(ResponseStatus.SUCCESS , responseMachineNodeLabels);
        }
        #endregion

        #region Insert Machine Labels Helper Functions
        /// <returns>
        ///     When successfully inserted a set of box labels, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static async Task<ServerResponse> InsertMachineBoxLabelsAsync(string machineLabelID , IList<ResponseMachineBoxLabel?> labels , DataContext db)
        {
            Guid machineLabelGuid = Guid.Parse(machineLabelID);
            for (byte i = 0; i < labels.Count; i++)
            {
                if (labels[i] is null)
                    db.MachineBoxLabels.Add(
                        new DbMachineBoxLabel
                        {
                            LabelIndex = i ,
                            MachineLabelID = machineLabelGuid ,

                            Color = null ,
                            Height = null ,
                            Width = null ,
                            StartX = null ,
                            StartY = null ,
                        }
                    );
                else
                    db.MachineBoxLabels.Add(
                        new DbMachineBoxLabel
                        {
                            LabelIndex = i ,
                            MachineLabelID = machineLabelGuid ,

                            Color = labels[i]!.Color ,
                            Height = labels[i]!.Size?.Y ,
                            Width = labels[i]!.Size?.X ,
                            StartX = labels[i]!.Start?.X ,
                            StartY = labels[i]!.Start?.Y ,
                        }
                    );
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully inserted a set of text labels, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static async Task<ServerResponse> InsertMachineTextLabelsAsync(string machineLabelId , IList<ResponseMachineTextLabel?> labels , DataContext db)
        {
            Guid machineLabelGuid = Guid.Parse(machineLabelId);
            for (byte i = 0; i < labels.Count; i++)
            {
                if (labels[i] is null)
                    db.TextLabels.Add(
                        new DbMachineTextLabel
                        {
                            LabelIndex = i ,
                            MachineLabelID = machineLabelGuid ,

                            PosX = null ,
                            PosY = null ,
                            Value = null ,
                        }
                    );
                else
                    db.TextLabels.Add(
                        new DbMachineTextLabel
                        {
                            LabelIndex = i ,
                            MachineLabelID = machineLabelGuid ,

                            PosX = labels[i]!.Position?.X ,
                            PosY = labels[i]!.Position?.Y ,
                            Value = labels[i]!.Value ,
                        }
                    );
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <returns>
        ///     When successfully inserted a set of node labels, return status "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static async Task<ServerResponse> InsertMachineNodeLabelsAsync(string machineLabelID , IList<ResponseMachineNodeLabel?> labels , DataContext db)
        {
            Guid machineLabelGuid = Guid.Parse(machineLabelID);
            for (byte i = 0; i < labels.Count; i++)
            {
                if (labels[i] is null)
                    db.NodeLabels.Add(
                        new DbMachineNodeLabel
                        {
                            LabelIndex = i ,
                            MachineLabelID = machineLabelGuid ,

                            PosX = null ,
                            PosY = null ,
                            Label = null ,
                            IsFinal = null ,
                        }
                    );
                else
                    db.NodeLabels.Add(
                        new DbMachineNodeLabel
                        {
                            LabelIndex = i ,
                            MachineLabelID = machineLabelGuid ,
                            PosX = labels[i]!.Position?.X ,
                            PosY = labels[i]!.Position?.Y ,
                            Label = labels[i]!.Label ,
                            IsFinal = labels[i]!.IsFinal ,
                        }
                    );
            }

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        #endregion
        #endregion
    }
}
