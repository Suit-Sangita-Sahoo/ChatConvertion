using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace RealTimeChat.Data
{
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "mysql-2c303283-suitsangitasahoo-ee93.b.aivencloud.com";
            var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "27566";
            var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "defaultdb";
            var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "avnadmin";
            var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";

            var connectionString =
                $"Server={dbHost};" +
                $"Port={dbPort};" +
                $"Database={dbName};" +
                $"User={dbUser};" +
                $"Password={dbPassword};" +
                $"SslMode=Required;";

            var optionsBuilder =
                new DbContextOptionsBuilder<AppDbContext>();

            optionsBuilder.UseMySql(
                connectionString,
                ServerVersion.AutoDetect(connectionString)
            );

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}