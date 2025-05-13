namespace TuringMachine.Backend.Server.Database.Entity.UserManagement
{
    internal class UserLicensePair
    {
        public Guid UUID       { get; set; }
        public Guid LicenseKey { get; set; }


        #region Relationship
        public User       User    { get; set; }
        public LicenseKey License { get; set; }
        #endregion
    }
}
