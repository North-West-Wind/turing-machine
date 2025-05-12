using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbTestCase = TuringMachine.Backend.Server.Database.Entity.LevelInfos.TestCase;
using DbLevelTemplate = TuringMachine.Backend.Server.Database.Entity.LevelInfos.LevelTemplate;

using ResponseTestCase = TuringMachine.Backend.Server.Models.LevelTemplates.TestCase;
using ResponseConstraint = TuringMachine.Backend.Server.Models.LevelTemplates.Constraint;
using ResponseLevelTemplate = TuringMachine.Backend.Server.Models.LevelTemplates.LevelTemplate;
#endregion

namespace TuringMachine.Backend.Server.DbInteraction
{
    internal static class DbLevelInfosInteraction
    {
        public static ServerResponse<ResponseLevelTemplate> GetLevelTemplate(byte levelID , DataContext db)  // TODO: add data verification
        {
            using IEnumerator<DbLevelTemplate> levelTemplates = db.LevelTemplates.Where(template => template.LevelID == levelID).GetEnumerator();
            if (!levelTemplates.MoveNext()) return ServerResponse.StartTracing<ResponseLevelTemplate>(nameof(GetLevelTemplate) , NO_SUCH_ITEM);
            DbLevelTemplate dbLevelTemplate = levelTemplates.Current;
            if (levelTemplates.MoveNext()) return ServerResponse.StartTracing<ResponseLevelTemplate>(nameof(GetLevelTemplate) , DUPLICATED_ITEM);

            ServerResponse<ICollection<ResponseTestCase>> getTestCasesResponse = GetTestCase(levelID , db);
            if (getTestCasesResponse.Status is not (SUCCESS or NO_SUCH_ITEM))
                return ServerResponse.StartTracing<ResponseLevelTemplate>(nameof(GetLevelTemplate) , getTestCasesResponse.Status);

            ResponseConstraint constraint = new ResponseConstraint
            {
                MinState              = dbLevelTemplate.MinState ,
                MaxState              = dbLevelTemplate.MaxState ,
                MinTransition         = dbLevelTemplate.MinTransition ,
                MaxTransition         = dbLevelTemplate.MaxTransition ,
                MinTape               = dbLevelTemplate.MinTape ,
                MaxTape               = dbLevelTemplate.MaxTape ,
                MinHead               = dbLevelTemplate.MinHead ,
                MaxHead               = dbLevelTemplate.MaxHead ,
                AllowInfinite         = dbLevelTemplate.AllowInfiniteTape ,
                AllowLeftLimited      = dbLevelTemplate.AllowLeftLimitedTape ,
                AllowRightLimited     = dbLevelTemplate.AllowRightLimitedTape ,
                AllowLeftRightLimited = dbLevelTemplate.AllowLeftRightLimitedTape ,
                AllowCircular         = dbLevelTemplate.AllowCircularTape ,
            };

            ResponseLevelTemplate responseLevelTemplate = new ResponseLevelTemplate
            {
                LevelID            = dbLevelTemplate.LevelID ,

                Title              = dbLevelTemplate.Title ,
                Description        = dbLevelTemplate.Description ,

                ParentID           = dbLevelTemplate.ParentID ,
                ChildrenID         = dbLevelTemplate.ChildrenID ?? [] ,

                TestCases          = getTestCasesResponse.Result ?? [] ,
                Constraints        = constraint ,

                MinTransitionCount = dbLevelTemplate.MinTransition ,
                MinStateCount      = dbLevelTemplate.MinState ,
                MinHeadCount       = dbLevelTemplate.MinHead ,
                MinTapeCount       = dbLevelTemplate.MinTape ,
                MaxTransitionCount = dbLevelTemplate.MaxTransition ,
                MaxStateCount      = dbLevelTemplate.MaxState ,
                MaxHeadCount       = dbLevelTemplate.MaxHead ,
                MaxTapeCount       = dbLevelTemplate.MaxTape ,
            };

            return new ServerResponse<ResponseLevelTemplate>(SUCCESS , responseLevelTemplate);
        }


        /// <returns>
        ///     Return a collection of test cases for a particular level when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "NO_SUCH_ITEM".
        /// </returns>
        private static ServerResponse<ICollection<ResponseTestCase>> GetTestCase(byte levelID , DataContext db)
        {
            IQueryable<DbTestCase> dbTestCases = db.TestCases.Where(testcase => testcase.LevelID == levelID);

            List<ResponseTestCase> responseTestCases = [];
            foreach (DbTestCase testcase in dbTestCases)
                responseTestCases.Add(
                    new ResponseTestCase { Input = testcase.Input , Output = testcase.Output }
                );

            if (responseTestCases.Count == 0)
                return ServerResponse.StartTracing<ICollection<ResponseTestCase>>(nameof(GetTestCase) , NO_SUCH_ITEM);

            return new ServerResponse<ICollection<ResponseTestCase>>(SUCCESS , responseTestCases);
        }
    }
}
