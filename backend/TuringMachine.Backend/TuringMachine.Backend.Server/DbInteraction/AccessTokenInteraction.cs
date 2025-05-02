using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

#region Type Alias
// @formatter:off
using DbUser = TuringMachine.Backend.Server.Database.Entity.UserManagement.User;

using ResponseUser = TuringMachine.Backend.Server.Models.UserManagement.User;
// @formatter:on
#endregion

namespace TuringMachine.Backend.Server.DbInteraction
{
    internal static class AccessTokenInteraction
    {
        #region Access Token Manipulation
        /// <returns>
        ///     Nothing data will be returned. <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse> GenerateUniqueAccessTokenAsync(string username , DataContext db)
        {
            using IEnumerator<DbUser> users = db.Users.Where(user => user.Username == username).GetEnumerator();

            if (!users.MoveNext())
                return new ServerResponse(ResponseStatus.USER_NOT_FOUND);

            DbUser user = users.Current;
            if (users.MoveNext())
                return new ServerResponse(ResponseStatus.DUPLICATED_USER);

            // generate unique access token
            byte[] token = new byte[24];
            do
                Random.Shared.NextBytes(token);
            while (await db.Users.AnyAsync(u => u.AccessToken == Convert.ToHexString(token)));

            user.AccessToken     = Convert.ToBase64String(token);
            user.TokenExpireTime = DateTime.Now.AddMinutes(30);

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        
        /// <summary> Expires the access token. </summary>
        /// <returns>
        ///     No data is returned. <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse> SetExpiredAsync(string accessToken , DataContext db)
        {
            using IEnumerator<DbUser> dbUsers = db.Users.Where(user => user.AccessToken == accessToken).GetEnumerator();
            if (!dbUsers.MoveNext()) { return new ServerResponse(ResponseStatus.USER_NOT_FOUND); }

            DbUser user = dbUsers.Current;
            if (dbUsers.MoveNext()) { return new ServerResponse(ResponseStatus.DUPLICATED_USER); }

            // set access token as expired
            user.TokenExpireTime = DateTime.Now.AddTicks(-1);
            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <summary> Validate the access of token. </summary>
        /// <remarks> Extends the access time by 30 minutes. </remarks>
        /// <returns>
        ///     No data is returned. <br/><br/>
        ///     Status is either "SUCCESS", "TOKEN_EXPIRED", "USER_NOT_FOUND" and "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse> ValidateAccessTokenAsync(string accessToken , DataContext db) => (await GetAndValidateUserAsync(accessToken , db));

        /// <summary> Get user by non-expired access token. </summary>
        /// <remarks> Extends the access time by 30 minutes. </remarks>
        /// <returns>
        ///     User will be returned when status is "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "TOKEN_EXPIRED", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse<ResponseUser>> GetAndValidateUserAsync(string accessToken , DataContext db)
        {
            using IEnumerator<DbUser> users = db.Users.Where(user => user.AccessToken == accessToken).GetEnumerator();

            if (!users.MoveNext())
                return new ServerResponse<ResponseUser>(ResponseStatus.USER_NOT_FOUND);

            DbUser user = users.Current;
            if (users.MoveNext())
                return new ServerResponse<ResponseUser>(ResponseStatus.DUPLICATED_USER);
#if RELEASE
            if (user.TokenExpireTime < DateTime.Now) 
                return new ServerResponse<ResponseUser>(Status.Expired);
#endif
            user.TokenExpireTime = DateTime.Now.AddMinutes(30);  // updates access token expire time
            await db.SaveChangesAsync();
            return new ServerResponse<ResponseUser>(ResponseStatus.SUCCESS , new ResponseUser { UUID = user.UUID , Username = user.Username , Password = user.Password });
        }
        #endregion


        #region MISC
        /// <summary> Check if the access token belongs to a user. </summary>
        /// <remarks> Will not update the expired time. </remarks>
        /// <returns>
        ///     No data is returned. <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER". "SUCCESS" indicates user exist.
        /// </returns>
        public static ServerResponse IsUserExist(string accessToken , DataContext db) => GetUser(accessToken , db);

        /// <summary> Get user by access token. Accept expired token. </summary>
        /// <remarks> Will not update the expired time. </remarks>
        /// <returns>
        ///     User will only be returned when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static ServerResponse<ResponseUser> GetUser(string accessToken , DataContext db)
        {
            using IEnumerator<DbUser> users = db.Users.Where(user => user.AccessToken == accessToken).GetEnumerator();
            if (!users.MoveNext())
                return new ServerResponse<ResponseUser>(ResponseStatus.USER_NOT_FOUND);

            DbUser user = users.Current;
            if (users.MoveNext())
                return new ServerResponse<ResponseUser>(ResponseStatus.DUPLICATED_USER);

            return new ServerResponse<ResponseUser>(ResponseStatus.SUCCESS , new ResponseUser { UUID = user.UUID , Username = user.Username , Password = user.Password });
        }
        #endregion
    }
}
