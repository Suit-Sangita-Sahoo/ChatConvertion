// using Microsoft.EntityFrameworkCore;
// using RealTimeChat.Models;

// namespace RealTimeChat.Data;

// public class AppDbContext : DbContext
// {
//     public AppDbContext(
//         DbContextOptions<AppDbContext> options)
//         : base(options)
//     {
//     }

//     // Users table
//     public DbSet<User> Users { get; set; }

//     // Messages table
//     public DbSet<Message> Messages { get; set; }


//     protected override void OnModelCreating(
//         ModelBuilder modelBuilder)
//     {
//         base.OnModelCreating(modelBuilder);


//         // =====================================================
//         // MESSAGE -> SENDER
//         // =====================================================

//         modelBuilder.Entity<Message>()
//             .HasOne(m => m.Sender)
//             .WithMany()
//             .HasForeignKey(m => m.SenderId)
//             .OnDelete(DeleteBehavior.Restrict);


//         // =====================================================
//         // MESSAGE -> RECEIVER
//         // =====================================================

//         modelBuilder.Entity<Message>()
//             .HasOne(m => m.Receiver)
//             .WithMany()
//             .HasForeignKey(m => m.ReceiverId)
//             .OnDelete(DeleteBehavior.Restrict);
//     }
// }