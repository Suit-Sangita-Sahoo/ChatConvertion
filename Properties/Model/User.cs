namespace RealTimeChat.Models;

public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string? ProfileImage { get; set; }

    public bool IsOnline { get; set; }

    public DateTime LastSeen { get; set; }
}