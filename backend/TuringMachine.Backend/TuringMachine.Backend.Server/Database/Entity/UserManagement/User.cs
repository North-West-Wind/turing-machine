namespace TuringMachine.Backend.Server.Database.Entity.UserManagement
{
    internal class User
    {
        public Guid     UUID                  { get; set; }
        public string   Username              { get; set; }
        public byte[]   Password              { get; set; }
        public string   AccessToken           { get; set; }
        public DateTime AccessTokenExpireTime { get; set; }
        public Guid     LicenseKey            { get; set; }
    }
}