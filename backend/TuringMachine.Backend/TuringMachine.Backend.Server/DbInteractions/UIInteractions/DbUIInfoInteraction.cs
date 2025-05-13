using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Database.Entity.UILabels;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.Models.UserInterface;
using TuringMachine.Backend.Server.Models.UserInterface.HighlightBoxes;
using TuringMachine.Backend.Server.Models.UserInterface.Nodes;
using TuringMachine.Backend.Server.ServerResponses;

using TransitionLine = TuringMachine.Backend.Server.Models.UserInterface.TransitionLine;
using TextLabel = TuringMachine.Backend.Server.Models.UserInterface.TextLabels.TextLabel;

namespace TuringMachine.Backend.Server.DbInteractions.UIInteractions
{
    internal class DbUIInfoInteraction
    {
        public static ServerResponse<IList<UI>> GetUIInfo(string machineID , DataContext db)
        {
            List<UI> uis = new List<UI>();
            
            foreach(UIInfo uiInfo in db.UiInfos.Where(v => v.DesignID == Guid.Parse(machineID)))
            {
                ServerResponse<IList<Node>> nodesResponse = DbNodeInteraction.GetNode(uiInfo.UILabelID.ToString() , db);
                if (nodesResponse.Status is not ResponseStatus.SUCCESS)
                    return ServerResponse.StartTracing<IList<UI>>(nameof(DbNodeInteraction.GetNode) , nodesResponse.Status);
            
                ServerResponse<IList<TransitionLine>> transitionLinesResponse = DbTransitionLineInteraction.GetTransitionLine(uiInfo.UILabelID.ToString() , db);
                if (transitionLinesResponse.Status is not ResponseStatus.SUCCESS)
                    return ServerResponse.StartTracing<IList<UI>>(nameof(DbTransitionLineInteraction.GetTransitionLine) , transitionLinesResponse.Status);
            
                ServerResponse<IList<HighlightBox>> highlightBoxesResponse = DbHighlightBoxInteraction.GetHighlightBox(uiInfo.UILabelID.ToString() , db);
                if (highlightBoxesResponse.Status is not ResponseStatus.SUCCESS)
                    return ServerResponse.StartTracing<IList<UI>>(nameof(DbHighlightBoxInteraction.GetHighlightBox) , highlightBoxesResponse.Status);
                
                ServerResponse<IList<TextLabel>> textLabelResponse = DbTextInteraction.GetTextLabel(uiInfo.UILabelID.ToString() , db);
                if (textLabelResponse.Status is not ResponseStatus.SUCCESS)
                    return ServerResponse.StartTracing<IList<UI>>(nameof(DbTextInteraction.GetTextLabel) , textLabelResponse.Status);
                
                uis.Add(new UI
                {
                    Color           = uiInfo.Color ,
                    Nodes           = nodesResponse.Result! ,
                    TransitionLines = transitionLinesResponse.Result! ,
                    HighlightBoxes  = highlightBoxesResponse.Result! ,
                    TextLabels      = textLabelResponse.Result!
                });
            }
            
            return new ServerResponse<IList<UI>>(ResponseStatus.SUCCESS , uis);
        }
        
        public static ServerResponse InsertUIInfo(string machineID , IEnumerable<UI> uiInfos , DataContext db)
        {
            foreach (UI ui in uiInfos)
            {
                UIInfo uiInfo = new UIInfo
                {
                    UILabelID = Guid.NewGuid() ,
                    DesignID  = Guid.Parse(machineID) ,
                    Color     = ui.Color
                };
                
                db.UiInfos.Add(uiInfo);
                DbNodeInteraction.InsertNode(uiInfo.UILabelID.ToString() , ui.Nodes , db);
                DbTransitionLineInteraction.InsertTransitionLine(uiInfo.UILabelID.ToString() , ui.TransitionLines , db);
                DbHighlightBoxInteraction.InsertHighlightBox(uiInfo.UILabelID.ToString() , ui.HighlightBoxes , db);
                DbTextInteraction.InsertTextLabel(uiInfo.UILabelID.ToString() , ui.TextLabels , db);
            }
            
            
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        
        public static ServerResponse DeleteUIInfo(string machineID , DataContext db)
        {
            foreach (UIInfo uiInfo in db.UiInfos.Where(v => v.DesignID == Guid.Parse(machineID)))
            {
                DbNodeInteraction.DeleteNode(uiInfo.UILabelID.ToString() , db);
                DbTransitionLineInteraction.DeleteTransitionLine(uiInfo.UILabelID.ToString() , db);
                DbHighlightBoxInteraction.DeleteHighlightBox(uiInfo.UILabelID.ToString() , db);
                DbTextInteraction.DeleteTextLabel(uiInfo.UILabelID.ToString() , db);
                db.UiInfos.Remove(uiInfo);
            }

            return new ServerResponse(ResponseStatus.SUCCESS);
        }
    }
}