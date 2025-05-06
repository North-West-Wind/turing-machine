using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database.Entity.Level;
using TuringMachine.Backend.Server.Database.Entity.Machine;
using TuringMachine.Backend.Server.Database.Entity.Progress;
using TuringMachine.Backend.Server.Database.Entity.UiLabels;
using TuringMachine.Backend.Server.Database.Entity.UiLabels.MachineLabels;
using TuringMachine.Backend.Server.Database.Entity.UserManagement;

namespace TuringMachine.Backend.Server.Database
{
    internal class DataContext : DbContext
    {
        #region Level
        public DbSet<LevelInfo>         LevelInfos         { get; set; }
        public DbSet<LevelRelationship> LevelRelationships { get; set; }
        public DbSet<TestCase>          TestCases          { get; set; }
        #endregion

        #region Machine
        public DbSet<Head>                Heads                { get; set; }
        public DbSet<MachineDesign>       MachineDesigns       { get; set; }
        public DbSet<Machine>             Machines             { get; set; }
        public DbSet<Tape>                Tapes                { get; set; }
        public DbSet<Transition>          Transition           { get; set; }
        public DbSet<TransitionStatement> TransitionStatements { get; set; }
        #endregion

        #region Progress
        public DbSet<LevelProgress> LevelProgresses { get; set; }
        #endregion

        #region UI
        public DbSet<MachineBoxLabel>    MachineBoxLabels   { get; set; }
        public DbSet<MachineLabel>       MachineLabels      { get; set; }
        public DbSet<NodeLabel>          NodeLabels         { get; set; }
        public DbSet<TextLabel>          TextLabels         { get; set; }
        public DbSet<TransitionLinePath> TransitionLinePath { get; set; }
        #endregion

        #region User
        public DbSet<User>       Users       { get; set; }
        public DbSet<LicenseKey> LicenseKeys { get; set; }
        #endregion


        public DataContext(DbContextOptions<DataContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            #region Table Schema Assignment
            // Level Schema
            modelBuilder.Entity<LevelInfo>()
                        .ToTable("LevelInfos" , "Level");
            modelBuilder.Entity<LevelRelationship>()
                        .ToTable("LevelRelationships" , "Level");
            modelBuilder.Entity<TestCase>()
                        .ToTable("TestCases" , "Level");

            // Machine Schema
            modelBuilder.Entity<Head>()
                        .ToTable("Heads" , "Machine");
            modelBuilder.Entity<MachineDesign>()
                        .ToTable("MachineDesigns" , "Machine");
            modelBuilder.Entity<Machine>()
                        .ToTable("Machines" , "Machine");
            modelBuilder.Entity<Tape>()
                        .ToTable("Tapes" , "Machine");
            modelBuilder.Entity<Transition>()
                        .ToTable("Transitions" , "Machine");
            modelBuilder.Entity<TransitionStatement>()
                        .ToTable("TransitionStatements" , "Machine");

            // Progress Schema
            modelBuilder.Entity<LevelProgress>()
                        .ToTable("LevelProgresses" , "Progress");

            // UI Schema
            modelBuilder.Entity<MachineBoxLabel>()
                        .ToTable("MachineBoxLabels" , "UI");
            modelBuilder.Entity<MachineLabel>()
                        .ToTable("MachineLabels" , "UI");
            modelBuilder.Entity<NodeLabel>()
                        .ToTable("NodeLabels" , "UI");
            modelBuilder.Entity<TextLabel>()
                        .ToTable("TextLabels" , "UI");
            modelBuilder.Entity<TransitionLinePath>()
                        .ToTable("TransitionLinePath" , "UI");

            // User Schema
            modelBuilder.Entity<User>()
                        .ToTable("Users" , "User");
            modelBuilder.Entity<LicenseKey>()
                        .ToTable("LicenseKeys" , "User");
            modelBuilder.Entity<UserLicensePair>()
                        .ToTable("UserLicensePair" , "User");
            #endregion

            #region Primary Key Assignment
            // Level Schema
            modelBuilder.Entity<LevelInfo>()
                        .HasKey(level => level.LevelID);
            modelBuilder.Entity<LevelRelationship>()
                        .HasKey(relationship => new { relationship.ParentLevel , relationship.ChildLevel });
            modelBuilder.Entity<TestCase>()
                        .HasKey(test => new { test.LevelID , test.TestCaseIndex });

            // Machine Schema
            modelBuilder.Entity<Head>()
                        .HasKey(head => new { head.MachineID , head.HeadIndex });
            modelBuilder.Entity<Machine>()
                        .HasKey(machine => machine.MachineID);
            modelBuilder.Entity<MachineDesign>()
                        .HasKey(design => design.DesignID);
            modelBuilder.Entity<Tape>()
                        .HasKey(tape => tape.TapeID);
            modelBuilder.Entity<Transition>()
                        .HasKey(transition => transition.TransitionID);
            modelBuilder.Entity<TransitionStatement>()
                        .HasKey(statement => new { statement.TransitionID , statement.StatementIndex });

            // Progress Schema
            modelBuilder.Entity<LevelProgress>()
                        .HasKey(progress => new { progress.UUID , progress.LevelID });

            // UI Schema
            modelBuilder.Entity<MachineLabel>()
                        .HasKey(label => label.MachineLabelID);
            modelBuilder.Entity<MachineBoxLabel>()
                        .HasKey(label => new { label.MachineLabelID , label.LabelIndex });
            modelBuilder.Entity<NodeLabel>()
                        .HasKey(label => new { label.MachineLabelID , label.LabelIndex });
            modelBuilder.Entity<TextLabel>()
                        .HasKey(label => new { label.MachineLabelID , label.LabelIndex });
            modelBuilder.Entity<TransitionLinePath>()
                        .HasKey(linePath => linePath.TransitionID);

            // User Schema
            modelBuilder.Entity<User>()
                        .HasKey(user => user.UUID);
            modelBuilder.Entity<LicenseKey>()
                        .HasKey(key => key.License);
            modelBuilder.Entity<UserLicensePair>()
                        .HasKey(pair => new { pair.UUID , pair.LicenseKey });
            #endregion

            #region Level Diagram
            modelBuilder.Entity<LevelInfo>()
                        .HasMany(level => level.TestCases)
                        .WithOne(testCase => testCase.LevelInfo)
                        .HasForeignKey(testCase => testCase.LevelID);
            modelBuilder.Entity<LevelInfo>()
                        .HasMany(l => l.ChildLevels)
                        .WithOne(l => l.ParentLevelNavigation)
                        .HasForeignKey(l => l.ParentLevel);
            modelBuilder.Entity<LevelInfo>()
                        .HasMany(l => l.ParentLevels)
                        .WithOne(l => l.ChildLevelNavigation)
                        .HasForeignKey(l => l.ChildLevel);
            #endregion

            #region Machine Diagram
            modelBuilder.Entity<MachineDesign>()
                        .HasMany(design => design.Tapes)
                        .WithOne(tape => tape.MachineDesign)
                        .HasForeignKey(tape => tape.DesignID);
            modelBuilder.Entity<MachineDesign>()
                        .HasMany(design => design.Machines)
                        .WithOne(machine => machine.Design)
                        .HasForeignKey(machine => machine.DesignID);

            modelBuilder.Entity<Machine>()
                        .HasMany(machine => machine.Transitions)
                        .WithOne(transition => transition.Machine)
                        .HasForeignKey(transition => transition.MachineID);
            modelBuilder.Entity<Machine>()
                        .HasOne(machine => machine.Label)
                        .WithOne(label => label.Machine)
                        .HasForeignKey<MachineLabel>(label => label.MachineID);
            modelBuilder.Entity<Machine>()
                        .HasMany(machine => machine.Heads)
                        .WithOne(head => head.Machine)
                        .HasForeignKey(head => head.MachineID);

            modelBuilder.Entity<Transition>()
                        .HasMany(transition => transition.Statements)
                        .WithOne(statement => statement.Transition)
                        .HasForeignKey(statement => statement.TransitionID);
            modelBuilder.Entity<Transition>()
                        .HasOne(transition => transition.TransisionLinePath)
                        .WithOne(lineSegments => lineSegments.Transision)
                        .HasForeignKey<TransitionLinePath>(linePath => linePath.TransitionID)
                        .HasPrincipalKey<Transition>(transition => transition.TransitionID);
            #endregion

            #region Machine Label Diagram
            modelBuilder.Entity<MachineLabel>()
                        .HasMany(machineLabel => machineLabel.BoxLabels)
                        .WithOne(boxLabel => boxLabel.MachineLabel)
                        .HasForeignKey(boxLabel => boxLabel.MachineLabelID);
            modelBuilder.Entity<MachineLabel>()
                        .HasMany(machineLabel => machineLabel.TextLabels)
                        .WithOne(textLabel => textLabel.MachineLabel)
                        .HasForeignKey(textLabel => textLabel.MachineLabelID);
            modelBuilder.Entity<MachineLabel>()
                        .HasMany(machineLabel => machineLabel.NodeLabels)
                        .WithOne(nodeLabel => nodeLabel.MachineLabel)
                        .HasForeignKey(nodeLabel => nodeLabel.MachineLabelID);
            #endregion

            #region Progress Diagram
            modelBuilder.Entity<User>()
                        .HasMany(user => user.Progresses)
                        .WithOne(progress => progress.User)
                        .HasForeignKey(progress => progress.UUID);
            modelBuilder.Entity<LevelProgress>()
                        .HasOne(progress => progress.Solution)
                        .WithOne(machineDesign => machineDesign.Progress)
                        .HasForeignKey<MachineDesign>(design => design.DesignID)
                        .HasPrincipalKey<LevelProgress>(progress => progress.DesignID);
            modelBuilder.Entity<LevelProgress>()
                        .HasOne(progress => progress.LevelInfo)
                        .WithOne(level => level.LevelProgress)
                        .HasForeignKey<LevelInfo>(level => level.LevelID)
                        .HasPrincipalKey<LevelProgress>(progress => progress.LevelID);
            #endregion

            #region User Diagram
            modelBuilder.Entity<User>()
                        .HasMany(user => user.Licenses)
                        .WithOne(key => key.User)
                        .HasForeignKey(key => key.UUID);

            modelBuilder.Entity<LicenseKey>()
                        .HasMany(key => key.Users)
                        .WithOne(user => user.License)
                        .HasForeignKey(user => user.LicenseKey);
            #endregion
        }
    }
}
