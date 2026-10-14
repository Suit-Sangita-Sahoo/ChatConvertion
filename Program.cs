using Microsoft.EntityFrameworkCore;
using RealTimeChat.Data;
using RealTimeChat.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// SERVICES
// ============================================================

builder.Services.AddControllers();
builder.Services.AddSignalR();

// ============================================================
// DATABASE CONNECTION - AIVEN MYSQL / ENV VARS / APPSETTINGS
// ============================================================

var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

string connectionString;

if (!string.IsNullOrWhiteSpace(dbHost) &&
    !string.IsNullOrWhiteSpace(dbPort) &&
    !string.IsNullOrWhiteSpace(dbName) &&
    !string.IsNullOrWhiteSpace(dbUser) &&
    !string.IsNullOrWhiteSpace(dbPassword))
{
    connectionString =
        $"Server={dbHost};" +
        $"Port={dbPort};" +
        $"Database={dbName};" +
        $"User={dbUser};" +
        $"Password={dbPassword};" +
        $"SslMode=Required;";
}
else
{
    // Fallback to appsettings or default Aiven MySQL credentials
    var defaultConn = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(defaultConn))
    {
        connectionString = defaultConn;
    }
    else
    {
        connectionString =
            $"Server={dbHost ?? "mysql-2c303283-suitsangitasahoo-ee93.b.aivencloud.com"};" +
            $"Port={dbPort ?? "27566"};" +
            $"Database={dbName ?? "defaultdb"};" +
            $"User={dbUser ?? "avnadmin"};" +
            $"Password={dbPassword ?? ""};" +
            $"SslMode=Required;";
    }
}

// ============================================================
// ENTITY FRAMEWORK CORE - MYSQL
// ============================================================

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    );
});

// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ============================================================
// BUILD APPLICATION
// ============================================================

var app = builder.Build();

// ============================================================
// AUTOMATIC DATABASE MIGRATION ON STARTUP
// ============================================================

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
        Console.WriteLine("[DB] Migrations applied successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB] Migration note: {ex.Message}");
    }
}

// ============================================================
// HTTP PIPELINE
// ============================================================

// Serve static frontend files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

// CORS
app.UseCors("AllowFrontend");

// SignalR & Controllers
app.MapControllers();
app.MapHub<ChatHub>("/chatHub");

// Fallback to index.html for page routing
app.MapFallbackToFile("index.html");

// ============================================================
// RUN
// ============================================================


app.Run();