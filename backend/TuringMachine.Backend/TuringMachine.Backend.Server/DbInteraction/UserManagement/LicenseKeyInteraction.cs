using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;


#region Type Alias
using DbLicenseKey = TuringMachine.Backend.Server.Database.Entity.UserManagement.LicenseKey;
#endregion

namespace TuringMachine.Backend.Server.DbInteraction.UserManagement
{
    internal static class LicenseKeyInteraction
    {
        #region Manipulating License Database
        /// <summary> Create one license key. </summary>
        /// <returns>
        ///     Returns a license key. <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static async Task<ServerResponse<string>> CreateLicenseAsync(DataContext db)
        {
            Guid newLicense = Guid.NewGuid();

            db.LicenseKeys.Add(new DbLicenseKey { License = Guid.NewGuid() , });

            await db.SaveChangesAsync();
            return new ServerResponse<string>(ResponseStatus.SUCCESS , newLicense.ToString());
        }

        /// <summary> Create a patch of license keys. </summary>
        /// <returns>
        ///     Returns a patch of license key. <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static async Task<ServerResponse<ICollection<string>>> CreateLicensePatchAsync(int patchSize , DataContext db)
        {
            string[] newLicenseKeys = new string[patchSize];
            for (int i = 0; i < patchSize; i++)
                newLicenseKeys[i] = (await CreateLicenseAsync(db)).Result!;
            return new ServerResponse<ICollection<string>>(ResponseStatus.SUCCESS , newLicenseKeys);
        }

        /// <summary> Removes license from database. </summary>
        /// <remarks> Do not remove license associated with users. </remarks>
        /// <returns>
        ///     No data is returned. <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM", "DUPLICATED_ITEM".
        /// </returns>
        public static async Task<ServerResponse> DeleteLicenseAsync(string licenseKey , DataContext db)
        {
            using IEnumerator<DbLicenseKey> licenseKeys = db.LicenseKeys.Where(key => key.License.ToString() == licenseKey).GetEnumerator();

            if (!licenseKeys.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteLicenseAsync) , ResponseStatus.NO_SUCH_ITEM);
            DbLicenseKey key = licenseKeys.Current;
            if (licenseKeys.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteLicenseAsync) , ResponseStatus.DUPLICATED_ITEM);

            db.LicenseKeys.Remove(key);

            await db.SaveChangesAsync();
            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        #endregion


        #region License Validation
        /// <summary> Check if a license key exist in the database. </summary>
        /// <returns>
        ///     No data is returned. <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "DUPLICATED_ITEM".
        /// </returns>
        public static ServerResponse ValidateLicenseKey(string licenseKey , DataContext db)
        {
            using IEnumerator<DbLicenseKey> licenseKeys = db.LicenseKeys.Where(key => key.License.ToString() == licenseKey).GetEnumerator();

            if (!licenseKeys.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteLicenseAsync) , ResponseStatus.NO_SUCH_ITEM);
            if (licenseKeys.MoveNext()) return ServerResponse.StartTracing(nameof(DeleteLicenseAsync) ,  ResponseStatus.DUPLICATED_ITEM);

            return new ServerResponse(ResponseStatus.SUCCESS);
        }
        #endregion
    }
}
