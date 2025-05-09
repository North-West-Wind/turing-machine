using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

#region Type Alias
using DbUser = TuringMachine.Backend.Server.Database.Entity.UserManagement.User;
using DbLicenseKey = TuringMachine.Backend.Server.Database.Entity.UserManagement.LicenseKey;
using DbUserLicensePair = TuringMachine.Backend.Server.Database.Entity.UserManagement.UserLicensePair;

using ResponseUser = TuringMachine.Backend.Server.Models.UserManagement.User;
#endregion

namespace TuringMachine.Backend.Server.DbInteraction.UserManagement
{
    internal static class UserInteraction
    {
        #region User Information Manipulation
        /// <param name="username"> A string representing of the string. </param>
        /// <param name="password"> A hexed value representing the hashed password. </param>
        /// <returns>
        ///     Returns a string as access token when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "USER_EXISTED" or BACKEND_ERROR.
        /// </returns>
        public static async Task<ServerResponse<string>> RegisterAsync(string username , string password , DataContext db)
        {
            using IEnumerator<DbUser> users = db.Users.Where(user => user.Username  == username).GetEnumerator();
            if (users.MoveNext()) return ServerResponse.StartTracing<string>(nameof(RegisterAsync) , ResponseStatus.USER_EXISTED);

            DbUser user = new DbUser
            {
                UUID = Guid.NewGuid() ,
                Username = username ,
                Password = Convert.ToHexString(SHA256.HashData(Encoding.ASCII.GetBytes(password))) ,
            };
            db.Users.Add(user);


            ServerResponse generateAccessTokenResponse = await AccessTokenInteraction.GenerateUniqueAccessTokenAsync(username , db);
            if (generateAccessTokenResponse.Status != ResponseStatus.SUCCESS)
                return generateAccessTokenResponse.WithThisTraceInfo<string>(nameof(RegisterAsync) , ResponseStatus.BACKEND_ERROR);

            await db.SaveChangesAsync();
            return new ServerResponse<string>(ResponseStatus.SUCCESS , user.AccessToken);
        }

        /// <param name="username"> A string representing of the string. </param>
        /// <param name="password"> A hexed value representing the hashed password. </param>
        /// <param name="licenseKey">
        ///     A GUID represented license key. <br/>
        ///     The license key only contains hex represented symbols with format like "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" (8-4-4-4-12) and will be validated with database.
        /// </param>
        /// <returns>
        ///     Returns a string as access token when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "INVALID_LICENSE" or "BACKEND_ERROR".
        /// </returns>
        public static async Task<ServerResponse<string>> RegisterAsync(string username , string password , string licenseKey , DataContext db)
        {
            ServerResponse<string> registerResponse = await RegisterAsync(username , password , db);
            if (registerResponse.Status is not ResponseStatus.SUCCESS)
                return registerResponse.WithThisTraceInfo<string>(nameof(RegisterAsync) , ResponseStatus.BACKEND_ERROR);

            // Try to add license key for the user.
            ServerResponse addLicenseKeyResponse = await AddLicenseKeyAsync(registerResponse.Result! , licenseKey , db);
            if (addLicenseKeyResponse.Status is not ResponseStatus.SUCCESS)
                return addLicenseKeyResponse.Status is ResponseStatus.INVALID_LICENSE 
                    ? new ServerResponse<string>(ResponseStatus.INVALID_LICENSE)   // If the license key is invalid, re-throw the error to clear stack trace.
                    : addLicenseKeyResponse.WithThisTraceInfo<string>(nameof(RegisterAsync) , ResponseStatus.BACKEND_ERROR);

            return new ServerResponse<string>(ResponseStatus.SUCCESS , registerResponse.Result);
        }

        /// <param name="licenseKey">
        ///     A GUID represented license key. <br/>
        ///     The license key only contains hex represented symbols with format like "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" (8-4-4-4-12) and will be validated with database.
        /// </param>
        /// <returns>
        ///     Returns nothing when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM", "TOKEN_EXPIRED", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns> 
        public static async Task<ServerResponse> AddLicenseKeyAsync(string accessToken , string licenseKey , DataContext db)
        {
            (ResponseStatus status , ResponseUser? user) = (await AccessTokenInteraction.GetAndValidateUserAsync(accessToken , db)).ToTuple();
            if (status != ResponseStatus.SUCCESS)
                return new ServerResponse(status);

            if (LicenseKeyInteraction.ValidateLicenseKey(licenseKey , db).Status != ResponseStatus.SUCCESS)
                return new ServerResponse(ResponseStatus.INVALID_LICENSE);

            status = (await UserLicenseInteraction.AssociateLicenceAsync(user!.UUID.ToString() , licenseKey , db)).Status;
            if (status != ResponseStatus.SUCCESS)
                return new ServerResponse(status);

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <summary> Change username. </summary>
        /// <remarks> Username will be used when login. Do confirm the user want to change their username before apply this API. </remarks>
        /// <returns>
        ///     No data will be returned. <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse> ChangeUsernameAsync(string accessToken , string newUsername , DataContext db)
        {
            ServerResponse<ResponseUser> getUserResponse = GetUser(accessToken , db);
            if (getUserResponse.Status != ResponseStatus.SUCCESS)  // return error code if database does not have one and only one corresponding user
                return new ServerResponse(getUserResponse.Status);

            getUserResponse.Result!.Username = newUsername;
            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }

        /// <summary> Change password. </summary>
        /// <remarks> Password will be used when login. Do confirm the user want to change their username before apply this API. </remarks>
        /// <returns>
        ///     No data will be returned. <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse> ChangePasswordAsync(string accessToken , string newPassword , DataContext db)
        {
            ServerResponse<ResponseUser> getUserResponse = GetUser(accessToken , db);
            if (getUserResponse.Status != ResponseStatus.SUCCESS)  // return error code if database does not have one and only one corresponding user
                return new ServerResponse(getUserResponse.Status);

            getUserResponse.Result!.Password = newPassword;
            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }


        /// <summary> Delete a user from the database. </summary>
        /// <remarks> This change is non-reversible. Do confirm the user want to change their username before apply this API. </remarks>
        /// <returns>
        ///     No data will be returned. <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND", or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse> DeleteUserAsync(string accessToken , DataContext db)
        {
            ServerResponse<ResponseUser> getUserResponse = GetUser(accessToken , db);
            if (getUserResponse.Status != ResponseStatus.SUCCESS)  // return error code if database does not have one and only one corresponding user
                return new ServerResponse(getUserResponse.Status);

            DbUser user = await db.Users.FirstAsync(user => user.AccessToken == accessToken);
            db.Users.Remove(user);
            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        #endregion


        #region User Login Related
        /// <param name="username"> A string representing the username. </param>
        /// <param name="hashedPassword"> A hexed value representing the hashed password. </param>
        /// <param name="salt"> A hexed value representing the salt. </param>
        /// <returns>
        ///     Returns a string as access token when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "INVALID_PASSWORD", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse<string>> LoginAsync(string username , string hashedPassword , string salt , DataContext db)
        {
            using IEnumerator<DbUser> users = db.Users.Where(user => user.Username == username).GetEnumerator();

            if (!users.MoveNext())
                return new ServerResponse<string>(ResponseStatus.USER_NOT_FOUND);

            DbUser user = users.Current;
            if (users.MoveNext())
                return new ServerResponse<string>(ResponseStatus.DUPLICATED_USER);
#if RELEASE
            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(user.Password , Convert.FromHexString(salt) , 1 , HashAlgorithmName.SHA256 , 32);   // TODO: Testing with frontend
            
            if (hash != Convert.FromHexString(hashedPassword)) 
                return new ServerResponse<string>(ResponseStatus.INVALID_USERNAME_OR_PASSWORD);
#else
            if (hashedPassword != user.Password)
                return new ServerResponse<string>(ResponseStatus.INVALID_PASSWORD);
#endif
            await AccessTokenInteraction.GenerateUniqueAccessTokenAsync(username , db);
            return new ServerResponse<string>(ResponseStatus.SUCCESS , user.AccessToken);
        }

        /// <returns>
        ///     No data is returned. <br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND", or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse> LogoutAsync(string accessToken , DataContext db) => await AccessTokenInteraction.SetExpiredAsync(accessToken , db);
        #endregion


        #region MISC
        /// <returns>
        ///     Returns a user when "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND" or "DUPLICATED_USER".
        /// </returns>
        public static ServerResponse<ResponseUser> GetUser(string uuid , DataContext db)
        {
            using IEnumerator<DbUser> users = db.Users.Where(user => user.UUID.ToString() == uuid).GetEnumerator();

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
