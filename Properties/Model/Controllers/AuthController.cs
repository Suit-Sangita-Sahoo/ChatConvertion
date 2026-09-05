using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealTimeChat.Data;
using RealTimeChat.Models;

namespace RealTimeChat.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }


    

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        Console.WriteLine("========== LOGIN ==========");

        Console.WriteLine(
            $"Email received: {request.Email}");

        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                success = false,
                message = "Email and password are required."
            });
        }


        // =====================================
        // FIND USER IN DATABASE
        // =====================================

        var email =
            request.Email.Trim().ToLower();

        var user =
            await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == email);


        Console.WriteLine(
            $"User found: {user != null}");



        if (user == null)
        {
            return Unauthorized(new
            {
                success = false,
                message = "No user found with this email."
            });
        }


        Console.WriteLine(
            $"User ID: {user.Id}");

        Console.WriteLine(
            $"Username: {user.Username}");


        
        if (user.Password != request.Password)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Incorrect password."
            });
        }


        // =====================================
        // MAKE USER ONLINE
        // =====================================

        user.IsOnline = true;

        user.LastSeen = DateTime.UtcNow;

        await _context.SaveChangesAsync();


        // =====================================
        // RETURN USER
        // =====================================

        // Temporarily use a simple token while
        // testing the database/login flow.

        return Ok(new
        {
            success = true,

            message = "Login successful.",

            token = "logged-in",

            user = new
            {
                id = user.Id,

                username = user.Username,

                email = user.Email,

                profileImage =
                    user.ProfileImage,

                isOnline =
                    user.IsOnline,

                lastSeen =
                    user.LastSeen
            }
        });
    }
}