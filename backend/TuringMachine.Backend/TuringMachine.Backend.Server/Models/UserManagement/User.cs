namespace TuringMachine.Backend.Server.Models.UserManagement
{
    internal class User
    {
        public int    Uuid;
        public string Name;
        public string Password;

        public string?   AccessToken;
        public DateTime? TokenExpireTime;
    }
}
