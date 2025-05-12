using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database.Entity.LevelInfos;
using TuringMachine.Backend.Server.Database.Entity.MachineStorage;
using TuringMachine.Backend.Server.Database.Entity.ProgressManagement;
using TuringMachine.Backend.Server.Database.Entity.UILabels;
using TuringMachine.Backend.Server.Database.Entity.UserManagement;

namespace TuringMachine.Backend.Server.Database
{
    internal class DataContext : DbContext
    {
        #region LevelInfos
        public DbSet<LevelTemplate> LevelTemplates { get; set; }
        public DbSet<TestCase>      TestCases      { get; set; }
        #endregion

        #region MachineStorage
        public DbSet<Head>                Heads                { get; set; }
        public DbSet<MachineDesign>       MachineDesigns       { get; set; }
        public DbSet<Machine>             Machines             { get; set; }
        public DbSet<SandboxDesignOwner>  SandboxDesignOwners  { get; set; }
        public DbSet<TapeInfo>            TapeInfos            { get; set; }
        public DbSet<Transition>          Transitions          { get; set; }
        public DbSet<TransitionStatement> TransitionStatements { get; set; }
        #endregion

        #region ProgressManagement
        public DbSet<Progress> Progresses { get; set; }
        #endregion

        #region UILabels
        public DbSet<HighlightBoxesLabel> HighlightBoxes  { get; set; }
        public DbSet<NodeLabel>           Nodes           { get; set; }
        public DbSet<TransitionLine>      TransitionLines { get; set; }
        public DbSet<UIInfo>              UiInfos         { get; set; }
        #endregion

        #region UserManagement
        public DbSet<LicenseKey> LicenseKeys { get; set; }
        public DbSet<User>       Users       { get; set; }
        #endregion


        public DataContext(DbContextOptions<DataContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            #region Table Schema Assignment
            #region LevelInfos
            string levelInfoSchema = "LevelInfos";
            modelBuilder
                .Entity<LevelTemplate>()
                .ToTable("LevelTemplates" , levelInfoSchema);
            modelBuilder
                .Entity<TestCase>()
                .ToTable("TestCases" , levelInfoSchema);
            #endregion

            #region MachineStorage
            string machineStorageSchema = "MachineStorage";
            modelBuilder
                .Entity<Head>()
                .ToTable("Heads" , machineStorageSchema);
            modelBuilder
                .Entity<MachineDesign>()
                .ToTable("MachineDesigns" , machineStorageSchema);
            modelBuilder
                .Entity<Machine>()
                .ToTable("Machines" , machineStorageSchema);
            modelBuilder
                .Entity<SandboxDesignOwner>()
                .ToTable("SandboxDesignOwners" , machineStorageSchema);
            modelBuilder
                .Entity<TapeInfo>()
                .ToTable("TapeInfos" , machineStorageSchema);
            modelBuilder
                .Entity<Transition>()
                .ToTable("Transitions" , machineStorageSchema);
            modelBuilder
                .Entity<TransitionStatement>()
                .ToTable("TransitionStatements" , machineStorageSchema);
            #endregion

            #region ProgressManagement
            string progressManagementSchema = "ProgressManagement";
            modelBuilder
                .Entity<Progress>()
                .ToTable("Progresses" , progressManagementSchema);
            #endregion

            #region UILabels
            string uiLabelsSchema = "UILabels";
            modelBuilder
                .Entity<HighlightBoxesLabel>()
                .ToTable("HighlightBoxes" , uiLabelsSchema);
            modelBuilder
                .Entity<NodeLabel>()
                .ToTable("Nodes" , uiLabelsSchema);
            modelBuilder
                .Entity<TransitionLine>()
                .ToTable("TransitionLines" , uiLabelsSchema);
            modelBuilder
                .Entity<UIInfo>()
                .ToTable("UIInfos" , uiLabelsSchema);
            #endregion

            #region UserManagement
            string userManagementSchema = "UserManagement";
            modelBuilder
                .Entity<LicenseKey>()
                .ToTable("LicenseKeys" , userManagementSchema);
            modelBuilder
                .Entity<User>()
                .ToTable("Users" , userManagementSchema);
            #endregion
            #endregion

            #region Primary Key Assignment
            modelBuilder
                .Entity<LevelTemplate>()
                .HasKey(level => level.LevelID);
            modelBuilder
                .Entity<TestCase>()
                .HasKey(test => new { test.LevelID , test.Input});

            modelBuilder
                .Entity<Head>()
                .HasKey(head => new { head.MachineID , head.HeadIndex });
            modelBuilder
                .Entity<MachineDesign>()
                .HasKey(design => design.DesignID);
            modelBuilder
                .Entity<Machine>()
                .HasKey(machine => machine.MachineID);
            modelBuilder
                .Entity<SandboxDesignOwner>()
                .HasKey(owner => new { owner.UUID , owner.DesignID });
            modelBuilder
                .Entity<TapeInfo>()
                .HasKey(tape => new { tape.DesignID , tape.TapeIndex });
            modelBuilder
                .Entity<Transition>()
                .HasKey(transition => transition.TransitionID);
            modelBuilder
                .Entity<TransitionStatement>()
                .HasKey(statement => new { statement.TransitionID , statement.StatementIndex });

            modelBuilder
                .Entity<Progress>()
                .HasKey(progress => new { progress.UUID , progress.LevelID });

            modelBuilder
                .Entity<HighlightBoxesLabel>()
                .HasKey(label => new { label.UILabelID , label.BoxIndex });
            modelBuilder
                .Entity<NodeLabel>()
                .HasKey(label => new { label.UILabelID , label.NodeID });
            modelBuilder
                .Entity<TransitionLine>()
                .HasKey(label => new { label.UILabelID , label.TransitionIndex });
            modelBuilder
                .Entity<UIInfo>()
                .HasKey(label => label.UILabelID);

            modelBuilder
                .Entity<LicenseKey>()
                .HasKey(key => key.License);
            modelBuilder
                .Entity<User>()
                .HasKey(user => user.UUID);
            #endregion

            #region Diagram
            #region LevelTemplateDiagram
            modelBuilder
                .Entity<LevelTemplate>()
                .HasMany(level => level.TestCases)
                .WithOne(test => test.LevelInfo)
                .HasForeignKey(test => test.LevelID);
            #endregion

            #region MachineDesignDiagram
            modelBuilder
                .Entity<MachineDesign>()
                .HasMany(design => design.Machines)
                .WithOne(machine => machine.BelongedDesign)
                .HasForeignKey(machine => machine.DesignID);
            modelBuilder
                .Entity<MachineDesign>()
                .HasMany(design => design.TapeInfos)
                .WithOne(tape => tape.BelongedDesign)
                .HasForeignKey(tape => tape.DesignID);
            modelBuilder
                .Entity<MachineDesign>()
                .HasMany(design => design.UIInfos)
                .WithOne(ui => ui.BelongedDesign)
                .HasForeignKey(ui => ui.DesignID);

            modelBuilder
                .Entity<Machine>()
                .HasMany(machine => machine.Heads)
                .WithOne(head => head.BelongedMachine)
                .HasForeignKey(head => head.MachineID);
            modelBuilder
                .Entity<Machine>()
                .HasMany(machine => machine.Transitions)
                .WithOne(transition => transition.BelongedMachine)
                .HasForeignKey(transition => transition.MachineID);

            modelBuilder
                .Entity<Transition>()
                .HasMany(transition => transition.TransitionStatements)
                .WithOne(statement => statement.BelongedTransition)
                .HasForeignKey(statement => statement.BelongedTransition);

            modelBuilder
                .Entity<UIInfo>()
                .HasMany(ui => ui.TransitionLines)
                .WithOne(line => line.BelongedUI)
                .HasForeignKey(line => line.BelongedUI);
            modelBuilder
                .Entity<UIInfo>()
                .HasMany(ui => ui.HighlighBoxes)
                .WithOne(box => box.BelongedUI)
                .HasForeignKey(box => box.BelongedUI);
            modelBuilder
                .Entity<UIInfo>()
                .HasMany(ui => ui.Nodes)
                .WithOne(node => node.BelongedUI)
                .HasForeignKey(node => node.BelongedUI);
            #endregion
            #endregion
        }
    }
}