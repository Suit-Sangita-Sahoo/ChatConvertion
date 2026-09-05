using Microsoft.EntityFrameworkCore;
using RealTimeChat.Models;

namespace RealTimeChat.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(m => m.Id);

                entity.Property(m => m.Content)
                    .HasMaxLength(5000);

                entity.Property(m => m.MessageType)
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(m => m.MediaUrl)
                    .HasMaxLength(1000);

                entity.Property(m => m.Status)
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(m => m.CreatedAt)
                    .IsRequired();

                // We intentionally don't configure Sender/Receiver
                // navigation properties here.
                // This avoids the relationship errors you previously had.
            });
        }
    }
}