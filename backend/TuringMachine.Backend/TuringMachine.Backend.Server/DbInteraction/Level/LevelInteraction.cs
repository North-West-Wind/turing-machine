using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.DbInteraction.Machine;
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
using System.Collections.Generic;
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
        public static async Task<ServerResponse<LevelResponseBody>> GetUserLevelInfoAsync(string uuid , byte levelID , DataContext db)
        {
            // check if user exists
            ServerResponse<ResponseUser> getUserResponse = await AccessTokenInteraction.GetAndValidateUserAsync(uuid , db);
            if (getUserResponse.Status is not (SUCCESS or TOKEN_EXPIRED or USER_NOT_FOUND))
                return getUserResponse.WithThisTraceInfo<LevelResponseBody>(nameof(GetUserLevelInfoAsync) , BACKEND_ERROR);

// @formatter:off
            // get user's progress
            ResponseUser user = getUserResponse.Result!;
            using IEnumerator<DbProgress> progresses = db.LevelProgresses.Where(progress => progress.UUID == user!.UUID && progress.LevelID == levelID)
                                                                         .Include(progress => progress.LevelInfo).ThenInclude(levelInfo => levelInfo.TestCases)
                                                                         .Include(progress => progress.LevelInfo).ThenInclude(levelInfo => levelInfo.ChildLevels)
                                                                         .Include(progress => progress.LevelInfo).ThenInclude(levelInfo => levelInfo.ParentLevels)
                                                                         .GetEnumerator();
// @formatter:on

            // confirms there is only one associated target progress in the database
            if (!progresses.MoveNext()) return new ServerResponse<LevelResponseBody>(NO_SUCH_ITEM);
            DbProgress progress = progresses.Current;
            if (progresses.MoveNext()) return ServerResponse.StartTracing<LevelResponseBody>(nameof(GetUserLevelInfoAsync) , DUPLICATED_ITEM);

            // get last submitted design if user had submitted last time
            ServerResponse<ResponseMachineDesign>? machineDesignResponse = null;
            if (progress.Solution is not null)
            {
                machineDesignResponse = MachineInteraction.GetTuringMachineDesign(progress.Solution.DesignID.ToString() , db);
                if (machineDesignResponse.Status != SUCCESS)
                {
                    return machineDesignResponse.WithThisTraceInfo<LevelResponseBody>(
                        nameof(GetUserLevelInfoAsync) ,
                        machineDesignResponse.Status == NO_SUCH_ITEM
                            ? NO_SUCH_ITEM
                            : BACKEND_ERROR
                    );
                }
            }

// @formatter:off    concatenate allowed tape type into array
            List<TapeType> allowedTapeTypes = new List<TapeType>();
            if (progress.LevelInfo.AllowInfiniteTape        ) allowedTapeTypes.Add(TapeType.Infinite        );
            if (progress.LevelInfo.AllowLeftLimitedTape     ) allowedTapeTypes.Add(TapeType.LeftLimited     );
            if (progress.LevelInfo.AllowRightLimitedTape    ) allowedTapeTypes.Add(TapeType.RightLimited    );
            if (progress.LevelInfo.AllowLeftRightLimitedTape) allowedTapeTypes.Add(TapeType.LeftRightLimited);
            if (progress.LevelInfo.AllowCircularTape        ) allowedTapeTypes.Add(TapeType.Circular        );
            ResponseLevelConstraint levelConstraints = new ResponseLevelConstraint
            {
                States      = progress.LevelInfo.HasStateLimit      ? new ConstraintRange { Max = progress.LevelInfo.MaxState      , Min = progress.LevelInfo.MinState      } : null ,
                Transitions = progress.LevelInfo.HasTransitionLimit ? new ConstraintRange { Max = progress.LevelInfo.MaxTransition , Min = progress.LevelInfo.MinTransition } : null ,
                Tapes       = progress.LevelInfo.HasTapeLimit       ? new ConstraintRange { Max = progress.LevelInfo.MaxTape       , Min = progress.LevelInfo.MinTape       } : null ,
                Heads       = progress.LevelInfo.HasHeadLimit       ? new ConstraintRange { Max = progress.LevelInfo.MaxHead       , Min = progress.LevelInfo.MinHead       } : null ,
                TapeTypes   = allowedTapeTypes ,
            };
// @formatter:on

            // convert test cases
            ServerResponse<ICollection<ResponseTestCase>> getTestCasesResponse = GetTestCases(levelID , db);
            if (getTestCasesResponse.Status is not SUCCESS)
                return getUserResponse.WithThisTraceInfo<LevelResponseBody>(nameof(GetUserLevelInfoAsync) , BACKEND_ERROR);

            return new ServerResponse<LevelResponseBody>(
                SUCCESS , 

                new LevelResponseBody
                {
                    LevelID     = progress.LevelID ,
                    Title       = progress.LevelInfo.Title ,
                    Description = progress.LevelInfo.Description ,
// @formatter:off
                    Parents     = (   from relationship in progress.LevelInfo.ParentLevels  // using joint table (ParentLevels) to find parent levels
                                      let parentID = relationship.ParentLevel
                                      select parentID
                                    ).ToArray() ,
                    Children    = (   from relationship in progress.LevelInfo.ChildLevels  // using joint table (ChildLevels) to find child levels
                                      let childID = relationship.ChildLevel
                                      select childID
                                    ).ToArray() ,
// @formatter:on
                    TestCases   = getTestCasesResponse.Result ,
                    Constraints = levelConstraints ,

                    IsSolved = progress.IsSolved ,
                    Design   = machineDesignResponse?.Result ,

                    Operations = progress.Operations ,
                }
            );
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
