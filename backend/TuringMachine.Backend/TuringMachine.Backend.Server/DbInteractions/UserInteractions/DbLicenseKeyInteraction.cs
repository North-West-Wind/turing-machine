using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.ServerResponses;
using static TuringMachine.Backend.Server.Models.Misc.ResponseStatus;

namespace TuringMachine.Backend.Server.DbInteractions.UserInteractions
{
    internal class DbLicenseKeyInteraction
    {
        /// <returns>
        ///     Return a license key for a particular user when login "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        public static ServerResponse<string> CreateLicenseKey(DataContext db)
        {
            Guid licenseKey = Guid.NewGuid();
            db.LicenseKeys.Add(new Database.Entity.UserManagement.LicenseKey { License = licenseKey });

            return new ServerResponse<string>(SUCCESS , licenseKey.ToString());
        }

        /// <returns>
        ///     Return a license key for a particular user when login "SUCCESS". <br/><br/>
        ///     Status will always be "SUCCESS". But still include status comparison in case implementation changes (with error arise).
        /// </returns>
        /// <remarks> This method will make changes to database once completed. </remarks>
        public static async Task<ServerResponse<string>> CreateAndSaveLicenseKeyAsync(DataContext db)
        {
            Guid licenseKey = Guid.NewGuid();
            db.LicenseKeys.Add(new Database.Entity.UserManagement.LicenseKey { License = licenseKey });

            await db.SaveChangesAsync();
            return new ServerResponse<string>(SUCCESS , licenseKey.ToString());
        }


        /// <returns>
        ///     Return a license key for a particular user when login "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        public static ServerResponse<ICollection<string>> BatchCreateLicenseKey(int count , DataContext db)
        {
            string[] licenseKeys = new string[count];
            for (int i = 0; i < count; i++)
            {
                ServerResponse<string> createLicenseKeyResponse = CreateLicenseKey(db);
                if (createLicenseKeyResponse.Status is not SUCCESS)
                    return createLicenseKeyResponse.WithThisTraceInfo<ICollection<string>>(nameof(BatchCreateLicenseKey) , BACKEND_ERROR);

                licenseKeys[i] = createLicenseKeyResponse.Result!;
            }

            return new ServerResponse<ICollection<string>>(SUCCESS , licenseKeys);
        }

        /// <returns>
        ///     Return a license key for a particular user when login "SUCCESS". <br/><br/>
        ///     Status is either "SUCCESS" or "BACKEND_ERROR".
        /// </returns>
        /// <remarks> This method will make changes to database once completed. </remarks>
        public static async Task<ServerResponse<ICollection<string>>> BatchCreateAndSaveLicenseKeyAsync(int count , DataContext db)
        {
            ServerResponse<ICollection<string>> response = BatchCreateLicenseKey(count , db);
            if (response.Status is not SUCCESS)
                return response.WithThisTraceInfo<ICollection<string>>(nameof(BatchCreateAndSaveLicenseKeyAsync) , BACKEND_ERROR);

            await db.SaveChangesAsync();
            return response;
        }

        /// <returns>
        ///     Return "SUCCESS" when the license key is valid. <br/><br/>
        ///     Status is either "SUCCESS", "NO_SUCH_ITEM" or "DUPLICATED_ITEM".
        /// </returns>
        public static ServerResponse ValidateLicenseKey(string licenseKey , DataContext db)
        {
            using IEnumerator<Database.Entity.UserManagement.LicenseKey> licenseKeys = db.LicenseKeys.Where(key => key.License == Guid.Parse(licenseKey)).GetEnumerator();
            if (!licenseKeys.MoveNext()) return ServerResponse.StartTracing(nameof(ValidateLicenseKey) , NO_SUCH_ITEM);
            Database.Entity.UserManagement.LicenseKey dbLicenseKey = licenseKeys.Current;
            if (licenseKeys.MoveNext()) return ServerResponse.StartTracing(nameof(ValidateLicenseKey) , DUPLICATED_ITEM);

            return new ServerResponse(SUCCESS);
        }
    }
}
