using System.Diagnostics;
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
        /// <summary> Validates the token, and extends the token to 30 minutes after now. </summary>
        /// <returns>
        ///     Return an access token for a particular user when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static ServerResponse ValidateToken(string accessToken , DataContext db)
        {
            using IEnumerator<DbUser> user = db.Users.Where(user => user.AccessToken == accessToken).GetEnumerator();
            
            if (!user.MoveNext()) return ServerResponse.StartTracing<string>(nameof(ValidateToken) , USER_NOT_FOUND);
            DbUser dbUser = user.Current;
            if (user.MoveNext()) return ServerResponse.StartTracing<string>(nameof(ValidateToken) , DUPLICATED_USER);

            switch (dbUser.AccessToken , dbUser.AccessTokenExpireTime)
            {
                case (null , null):
                    throw new UnreachableException();

                case (not null , null):
                    return ServerResponse.StartTracing(nameof(ValidateToken) , BACKEND_ERROR);

                case (not null , not null) when dbUser.AccessTokenExpireTime >= DateTime.Now:
                    dbUser.AccessTokenExpireTime = DateTime.Now.AddMinutes(30);
                    return new ServerResponse(SUCCESS);

                case (not null , not null) when dbUser.AccessTokenExpireTime < DateTime.Now:
#if DEBUG
                    return new ServerResponse(SUCCESS);
#else
                    return new ServerResponse(TOKEN_EXPIRED);
#endif

                default: throw new UnreachableException();
            }
        }

        /// <summary> Validates the token, and extends the token to 30 minutes after now. </summary>
        /// <returns>
        ///     Return an access token for a particular user when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        /// <remarks> This method will make changes to database once completed. </remarks>
        public static async Task<ServerResponse> ValidateAndUpdateTokenAsync(string accessToken , DataContext db)
        {
            ServerResponse validateTokenResponse = ValidateToken(accessToken , db);
            if (validateTokenResponse.Status is not SUCCESS)
                return validateTokenResponse.WithThisTraceInfo(nameof(ValidateAndUpdateTokenAsync) , validateTokenResponse.Status);

            await db.SaveChangesAsync();
            return validateTokenResponse;
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
