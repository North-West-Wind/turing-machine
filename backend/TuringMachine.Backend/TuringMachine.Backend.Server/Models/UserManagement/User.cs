namespace TuringMachine.Backend.Server.Models.UserManagement
{
    internal class User
    {
        public Guid   UUID     { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
