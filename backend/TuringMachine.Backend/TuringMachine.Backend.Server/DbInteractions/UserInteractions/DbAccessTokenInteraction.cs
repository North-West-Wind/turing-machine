using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Database.Entity.UserManagement;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

#region Type Alias
using DbUser = TuringMachine.Backend.Server.Database.Entity.UserManagement.User;
#endregion

namespace TuringMachine.Backend.Server.DbInteractions.UserInteractions
{
    internal static class DbAccessTokenInteraction
    {
        public static ServerResponse ValidateToken(string accessToken , DataContext db)
        {
            throw new NotImplementedException();
        }


        /// <returns>
        ///     Return an access token for a particular user when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse<string>> CreateAccessTokenAsync(string uuid , DataContext db)
        {
            // find the target user and check if there is only one
            using IEnumerator<DbUser> dbUsers = db.Users.Where(user => user.UUID == Guid.Parse(uuid)).GetEnumerator();
            if (!dbUsers.MoveNext()) return ServerResponse.StartTracing<string>(nameof(CreateAccessTokenAsync) , USER_NOT_FOUND);
            DbUser dbUser = dbUsers.Current;
            if (dbUsers.MoveNext()) return ServerResponse.StartTracing<string>(nameof(CreateAccessTokenAsync) , DUPLICATED_USER);

            // generate unique access token
            byte[] token = new byte[24];
            do
                Random.Shared.NextBytes(token);
            while (await db.Users.AnyAsync(u => u.AccessToken == Convert.ToHexString(token)));

            // update access token with their time
            dbUser.AccessToken           = Convert.ToBase64String(token);
            dbUser.AccessTokenExpireTime = DateTime.Now.AddMinutes(30);

            return new ServerResponse<string>(SUCCESS , dbUser.AccessToken);
        }


        /// <returns>
        ///     Return an access token for a particular user when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        /// <remarks> This method will make changes to database once completed. </remarks>
        public static async Task<ServerResponse<string>> CreateAndSaveAccessTokenAsync(string uuid , DataContext db)
        {
            ServerResponse<string> createAccessTokenResponse = await CreateAccessTokenAsync(uuid , db);
            if (createAccessTokenResponse.Status is not SUCCESS)
                return createAccessTokenResponse.WithThisTraceInfo<string>(nameof(CreateAndSaveAccessTokenAsync) , createAccessTokenResponse.Status);

            await db.SaveChangesAsync();
            return createAccessTokenResponse;
        }
    }
}
