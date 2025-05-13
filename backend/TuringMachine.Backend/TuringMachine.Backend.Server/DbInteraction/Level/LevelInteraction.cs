using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.DbInteraction.Machine;
using TuringMachine.Backend.Server.DbInteraction.Progress;
using TuringMachine.Backend.Server.DbInteraction.UserManagement;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses.ResponseBody;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
// @formatter:off
using DbProgress = TuringMachine.Backend.Server.Database.Entity.Progress.LevelProgress;
using DbTestCase = TuringMachine.Backend.Server.Database.Entity.Level.TestCase;
using DbLevelInfo = TuringMachine.Backend.Server.Database.Entity.Level.LevelInfo;

using TapeType = TuringMachine.Backend.Server.Models.Machines.Tapes.TapeType;

using ResponseUser = TuringMachine.Backend.Server.Models.UserManagement.User;
using ResponseTestCase = TuringMachine.Backend.Server.Models.Levels.TestCase;
using ResponseMachineDesign = TuringMachine.Backend.Server.Models.Machines.TuringMachineDesign;
using ResponseLevelConstraint = TuringMachine.Backend.Server.Models.Levels.Constraint;
// @formatter:on
#endregion

namespace TuringMachine.Backend.Server.DbInteraction.Level
{
    internal static class LevelInteraction
    {
        /// <returns>
        ///     Return level information with user progress when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<LevelResponseBody> GetUserLevelInfo(string uuid , byte levelID , DataContext db)
        {
            using IEnumerator<DbLevelInfo> levelInfos = db.LevelInfos.Where(level => level.LevelID == levelID).GetEnumerator();
            if (!levelInfos.MoveNext()) return ServerResponse.StartTracing<LevelResponseBody>(nameof(GetUserLevelInfo) , NO_SUCH_ITEM);
            DbLevelInfo levelInfo = levelInfos.Current;
            if (levelInfos.MoveNext()) return ServerResponse.StartTracing<LevelResponseBody>(nameof(GetUserLevelInfo) , DUPLICATED_ITEM);

            ServerResponse<ProgressResponseBody> getProgressResponse = ProgressInteraction.GetProgress(uuid , levelID , db);
            if (getProgressResponse.Status is not (SUCCESS or NO_SUCH_ITEM))
                return getProgressResponse.WithThisTraceInfo<LevelResponseBody>(nameof(GetUserLevelInfo) , BACKEND_ERROR);

            // @formatter:off    concatenate allowed tape type into array
            List<TapeType> allowedTapeTypes = new List<TapeType>();
            if (levelInfo.AllowInfiniteTape        ) allowedTapeTypes.Add(TapeType.Infinite        );
            if (levelInfo.AllowLeftLimitedTape     ) allowedTapeTypes.Add(TapeType.LeftLimited     );
            if (levelInfo.AllowRightLimitedTape    ) allowedTapeTypes.Add(TapeType.RightLimited    );
            if (levelInfo.AllowLeftRightLimitedTape) allowedTapeTypes.Add(TapeType.LeftRightLimited);
            if (levelInfo.AllowCircularTape        ) allowedTapeTypes.Add(TapeType.Circular        );
            ResponseLevelConstraint levelConstraints = new ResponseLevelConstraint
            {
                States      = levelInfo.HasStateLimit      ? new ConstraintRange { Max = levelInfo.MaxState      , Min = levelInfo.MinState      } : null ,
                Transitions = levelInfo.HasTransitionLimit ? new ConstraintRange { Max = levelInfo.MaxTransition , Min = levelInfo.MinTransition } : null ,
                Tapes       = levelInfo.HasTapeLimit       ? new ConstraintRange { Max = levelInfo.MaxTape       , Min = levelInfo.MinTape       } : null ,
                Heads       = levelInfo.HasHeadLimit       ? new ConstraintRange { Max = levelInfo.MaxHead       , Min = levelInfo.MinHead       } : null ,
                TapeTypes   = allowedTapeTypes ,
            };

            // convert test cases
            ServerResponse<ICollection<ResponseTestCase>> getTestCasesResponse = GetTestCases(levelID , db);
            if (getTestCasesResponse.Status is not SUCCESS)
                return getTestCasesResponse.WithThisTraceInfo<LevelResponseBody>(nameof(GetUserLevelInfo) , BACKEND_ERROR);

            LevelResponseBody levelProgressResult = new LevelResponseBody
            {
                LevelID     = levelID ,
                Title       = levelInfo.Title ,
                Description = levelInfo.Description ,

                Parents = (     from relation in db.LevelRelationships  // using joint table (ChildLevels) to find parent levels
                                where relation.ChildLevel == levelID
                                select relation.ParentLevel
                    ).ToArray() ,
                Children = (    from relation in db.LevelRelationships  // using joint table (ChildLevels) to find child levels
                                where relation.ParentLevel == levelID
                                select relation.ChildLevel
                    ).ToArray() ,

                TestCases   = getTestCasesResponse.Result ,
                Constraints = levelConstraints ,
            };

            if (getProgressResponse.Status is SUCCESS)
            {
                ProgressResponseBody progress = getProgressResponse.Result!;

                levelProgressResult.IsSolved = progress.IsSolved;
                levelProgressResult.Design = progress.MachineDesign;
                levelProgressResult.Operations = progress.Operations;
            }

            return new ServerResponse<LevelResponseBody>(SUCCESS , levelProgressResult);
        }

        /// <returns>
        ///     Returns the template of every level (no user progress; less information about the level). <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static async Task<ServerResponse<ICollection<SimplifiedLevelResponseBody>>> GetSimplifiedLevelTemplateInfosAsync(DataContext db)
        {
// @formatter:off
            IIncludableQueryable<DbLevelInfo , ICollection<DbTestCase>> levelInfos = db.LevelInfos.Include(levelInfo => levelInfo.ParentLevels)
                                                                                                  .Include(levelInfo => levelInfo.ChildLevels)
                                                                                                  .Include(levelInfo => levelInfo.TestCases);
// @formatter:on
            List<SimplifiedLevelResponseBody> levelResponses = await levelInfos.Select(
                levelInfo => new SimplifiedLevelResponseBody
                {
                    LevelID     = levelInfo.LevelID ,
                    Title       = levelInfo.Title ,
                    Description = levelInfo.Description ,
                    Parent      = (from relationship in levelInfo.ParentLevels select relationship.ParentLevel).ToArray() ,
                }
            )
            .ToListAsync();
            return new ServerResponse<ICollection<SimplifiedLevelResponseBody>>(SUCCESS , levelResponses);
        }


        /// <returns>
        ///     Returns a series of test cases for testing Turing Machine design. <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        private static ServerResponse<ICollection<ResponseTestCase>> GetTestCases(byte levelID , DataContext db)
        {
            IQueryable<DbTestCase> dbTestCases = db.TestCases.Where(testCase => testCase.LevelID == levelID);

            ResponseTestCase[] responseTestCases = new ResponseTestCase[dbTestCases.Count()];
            foreach (DbTestCase testCase in dbTestCases)
                responseTestCases[testCase.TestCaseIndex] = new ResponseTestCase
                {
                    Input  = testCase.Input ,
                    Output = testCase.Output ,
                };

            return new ServerResponse<ICollection<ResponseTestCase>>(SUCCESS , responseTestCases);
        }
    }
}
