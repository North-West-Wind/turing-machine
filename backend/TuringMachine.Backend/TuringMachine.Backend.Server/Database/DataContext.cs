using Microsoft.EntityFrameworkCore;

namespace TuringMachine.Backend.Server.Database
{
    internal class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            #region Table Schema Assignment

            #endregion

            #region Primary Key Assignment

            #endregion

            #region Diagram
            
            #endregion
        }
    }
}
