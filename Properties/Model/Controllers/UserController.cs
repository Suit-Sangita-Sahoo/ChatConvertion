using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealTimeChat.Data;

namespace RealTimeChat.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================
    // GET ALL USERS
    // GET: /api/users
    // =========================================

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search = null)
    {
        var query = _context.Users
            .AsNoTracking()
            .AsQueryable();

        // Search by username or email
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();

            query = query.Where(u =>
                u.Username.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search));
        }

        var users = await query
            .Select(u => new
            {
                id = u.Id,
                username = u.Username,
                email = u.Email,
                profileImage = u.ProfileImage,
                isOnline = u.IsOnline,
                lastSeen = u.LastSeen
            })
            .ToListAsync();

        return Ok(users);
    }


    // =========================================
    // GET ONE USER
    // GET: /api/users/1
    // =========================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new
            {
                id = u.Id,
                username = u.Username,
                email = u.Email,
                profileImage = u.ProfileImage,
                isOnline = u.IsOnline,
                lastSeen = u.LastSeen
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(user);
    }
}