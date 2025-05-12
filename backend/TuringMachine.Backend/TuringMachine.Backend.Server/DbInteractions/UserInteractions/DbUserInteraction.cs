using System.Security.Cryptography;
using System.Text;
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
    internal static class DbUserInteraction
    {
        /// <returns>
        ///     Return an access token for a particular user when login "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse<string>> LoginUserAsync(string username , string hashedPassword , string salt , DataContext db)
        {
            using IEnumerator<DbUser> users = db.Users.Where(user => user.Username == username).GetEnumerator();
            if (!users.MoveNext()) return ServerResponse.StartTracing<string>(nameof(LoginUserAsync) , USER_NOT_FOUND);
            DbUser dbUser = users.Current;
            if (users.MoveNext()) return ServerResponse.StartTracing<string>(nameof(LoginUserAsync) , DUPLICATED_USER);

#if RELEASE
            byte[] hash = SHA256.HashData(Encoding.ASCII.GetBytes(Convert.FromHexString(dbUser.Password) + salt));  // TODO: test login with frontend

            if (hash.SequenceEqual(Encoding.ASCII.GetBytes(hashedPassword)))
                return new ServerResponse<string>(INVALID_USERNAME_OR_PASSWORD);
#else
            if (hashedPassword != dbUser.Password)
                return new ServerResponse<string>(INVALID_PASSWORD);
#endif
            ServerResponse<string> createAndSaveAccessTokenResponse = await DbAccessTokenInteraction.CreateAndSaveAccessTokenAsync(dbUser.UUID.ToString() , db);
            if (createAndSaveAccessTokenResponse.Status is not SUCCESS)
                return createAndSaveAccessTokenResponse.WithThisTraceInfo<string>(nameof(LoginUserAsync) , BACKEND_ERROR);

            return createAndSaveAccessTokenResponse;
        }
    }
}
