using TuringMachine.Backend.Server.Database.Entity.Progress;

namespace TuringMachine.Backend.Server.Database.Entity.UserManagement
{
    internal class User
    {
        public Guid   UUID     { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }

        public string?   AccessToken     { get; set; }
        public DateTime? TokenExpireTime { get; set; }


        #region Relation
        public ICollection<LevelProgress>    Progresses { get; set; }
        public ICollection<UserLicensePair>? Licenses   { get; set; }
        #endregion
    }
}
