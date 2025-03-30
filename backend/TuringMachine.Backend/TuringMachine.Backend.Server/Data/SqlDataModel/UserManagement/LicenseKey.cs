namespace TuringMachine.Backend.Server.Data.SqlDataModel.UserManagement
{
    internal class LicenseKey
    {
        public Guid License { get; set; }


        #region Relation
        public ICollection<UserLicensePair> Users { get; set; }
        #endregion
    }
}
