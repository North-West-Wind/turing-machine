using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

#region Type Alias
using DbUserLicensePair = TuringMachine.Backend.Server.Database.Entity.UserManagement.UserLicensePair;
using DbLicenseKey = TuringMachine.Backend.Server.Database.Entity.UserManagement.LicenseKey;
using DbUser = TuringMachine.Backend.Server.Database.Entity.UserManagement.User;

using ResponseUser = TuringMachine.Backend.Server.Models.UserManagement.User;
#endregion

namespace TuringMachine.Backend.Server.DbInteraction.UserManagement
{
    internal static class UserLicenseInteraction
    {
        /// <summary> Associate license with a user. </summary>
        /// <param name="licenseKey">
        ///     A GUID represented license key. <br/>
        ///     The license key only contains hex represented symbols with format like "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" (8-4-4-4-12) and will be validated with database.
        /// </param>
        /// <returns>
        ///     No data is returned. <br/><br/>
        ///     Status is either "SUCCESS", "USER_NOT_FOUND", "NO_SUCH_ITEM" or "DUPLICATED_USER".
        /// </returns>
        public static async Task<ServerResponse> AssociateLicenceAsync(string uuid , string licenseKey , DataContext db)
        {
            using IEnumerator<DbUser> users = db.Users.Where(user => user.UUID.ToString() == uuid).GetEnumerator();
            if (!users.MoveNext()) return ServerResponse.StartTracing(nameof(AssociateLicenceAsync) , ResponseStatus.USER_NOT_FOUND);
            DbUser user = users.Current;
            if (users.MoveNext()) return ServerResponse.StartTracing(nameof(AssociateLicenceAsync) , ResponseStatus.DUPLICATED_USER);

            using IEnumerator<DbLicenseKey> licenseKeys = db.LicenseKeys.Where(key => key.License.ToString() == licenseKey).GetEnumerator();
            if (!licenseKeys.MoveNext()) return ServerResponse.StartTracing(nameof(AssociateLicenceAsync) , ResponseStatus.NO_SUCH_ITEM);
            if (licenseKeys.MoveNext()) return ServerResponse.StartTracing(nameof(AssociateLicenceAsync) ,  ResponseStatus.NO_SUCH_ITEM);

            if (user.Licenses is null)
                user.Licenses = new List<DbUserLicensePair>();

            // If the user has the same license key, do nothing.
            using IEnumerator<DbUserLicensePair> userKeyPairs = user.Licenses.Where(pair => pair.LicenseKey.ToString() == licenseKey).GetEnumerator();
            if (userKeyPairs.MoveNext()) return new ServerResponse(ResponseStatus.SUCCESS);

            user.Licenses.Add(
                new DbUserLicensePair
                {
                    UUID       = new Guid(uuid) ,
                    LicenseKey = new Guid(licenseKey) ,
                }
            );
            return new ServerResponse(ResponseStatus.SUCCESS);
        }


        public static async Task<ServerResponse> DeAssociateLicenseAsync(string uuid , string licenseKey , DataContext db)
        {
            throw new NotImplementedException();
        }
    }
}
