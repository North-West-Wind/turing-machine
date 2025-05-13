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
        public static ServerResponse<IList<UILabel>> GetUIInfo(string machineID , DataContext db)
        {
            List<UILabel> uis = new List<UILabel>();
            
            foreach(UIInfo uiInfo in db.UiInfos.Where(v => v.DesignID == Guid.Parse(machineID)))
            {
                ServerResponse<IList<Node>> nodesResponse = DbNodeInteraction.GetNode(uiInfo.UILabelID.ToString() , db);
                if (nodesResponse.Status is not ResponseStatus.SUCCESS)
                    return ServerResponse.StartTracing<IList<UILabel>>(nameof(DbNodeInteraction.GetNode) , nodesResponse.Status);
            
                ServerResponse<IList<TransitionLine>> transitionLinesResponse = DbTransitionLineInteraction.GetTransitionLine(uiInfo.UILabelID.ToString() , db);
                if (transitionLinesResponse.Status is not ResponseStatus.SUCCESS)
                    return ServerResponse.StartTracing<IList<UILabel>>(nameof(DbTransitionLineInteraction.GetTransitionLine) , transitionLinesResponse.Status);
            
                ServerResponse<IList<HighlightBox>> highlightBoxesResponse = DbHighlightBoxInteraction.GetHighlightBox(uiInfo.UILabelID.ToString() , db);
                if (highlightBoxesResponse.Status is not ResponseStatus.SUCCESS)
                    return ServerResponse.StartTracing<IList<UILabel>>(nameof(DbHighlightBoxInteraction.GetHighlightBox) , highlightBoxesResponse.Status);
                
                ServerResponse<IList<TextLabel>> textLabelResponse = DbTextInteraction.GetTextLabel(uiInfo.UILabelID.ToString() , db);
                if (textLabelResponse.Status is not ResponseStatus.SUCCESS)
                    return ServerResponse.StartTracing<IList<UILabel>>(nameof(DbTextInteraction.GetTextLabel) , textLabelResponse.Status);
                
                uis.Add(new UILabel
                {
                    Color           = uiInfo.Color ,
                    Nodes           = nodesResponse.Result! ,
                    TransitionLines = transitionLinesResponse.Result! ,
                    HighlightBoxes  = highlightBoxesResponse.Result! ,
                    TextLabels      = textLabelResponse.Result!
                });
            }
            
            return new ServerResponse<IList<UILabel>>(ResponseStatus.SUCCESS , uis);
        }
        
        public static ServerResponse InsertUIInfos(string designID , IEnumerable<UILabel> uiInfos , DataContext db)
        {
            foreach (UILabel ui in uiInfos)
            {
                UIInfo uiInfo = new UIInfo
                {
                    UILabelID = Guid.NewGuid() ,
                    DesignID  = Guid.Parse(designID) ,
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
        
        public static ServerResponse DeleteUIInfos(string designID , DataContext db)
        {
            foreach (UIInfo uiInfo in db.UiInfos.Where(v => v.DesignID == Guid.Parse(designID)))
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