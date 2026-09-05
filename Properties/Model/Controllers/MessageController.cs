using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealTimeChat.Data;
using RealTimeChat.Models;

namespace RealTimeChat.Controllers
{
    [ApiController]
    [Route("api/messages")]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public MessagesController(
            AppDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }


        // =====================================================
        // GET CHAT HISTORY
        // =====================================================

        [HttpGet("{user1Id}/{user2Id}")]
        public async Task<IActionResult> GetMessages(
            int user1Id,
            int user2Id)
        {
            var messages =
                await _context.Messages
                    .Where(m =>
                        (m.SenderId == user1Id &&
                         m.ReceiverId == user2Id)
                        ||
                        (m.SenderId == user2Id &&
                         m.ReceiverId == user1Id)
                    )
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new
                    {
                        id = m.Id,

                        senderId = m.SenderId,

                        receiverId = m.ReceiverId,

                        content = m.Content,

                        messageType = m.MessageType,

                        mediaUrl = m.MediaUrl,

                        status = m.Status,

                        createdAt = m.CreatedAt
                    })
                    .ToListAsync();


            return Ok(messages);
        }


        // =====================================================
        // UPLOAD IMAGE
        // =====================================================

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(
            IFormFile image)
        {
            // Check image
            if (image == null ||
                image.Length == 0)
            {
                return BadRequest(new
                {
                    message = "Please select an image."
                });
            }


            // Maximum 5 MB
            if (image.Length >
                5 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    message =
                        "Image size must be less than 5 MB."
                });
            }


            // Allowed types
            var allowedTypes =
                new[]
                {
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                };


            if (!allowedTypes.Contains(
                    image.ContentType
                ))
            {
                return BadRequest(new
                {
                    message =
                        "Only JPG, PNG and WEBP images are allowed."
                });
            }


            // =================================================
            // CREATE UPLOAD DIRECTORY
            // =================================================

            string uploadFolder =
                Path.Combine(
                    _environment.WebRootPath,
                    "uploads",
                    "chat"
                );


            if (!Directory.Exists(
                    uploadFolder))
            {
                Directory.CreateDirectory(
                    uploadFolder
                );
            }


            // =================================================
            // CREATE UNIQUE FILE NAME
            // =================================================

            string extension =
                Path.GetExtension(
                    image.FileName
                ).ToLowerInvariant();


            string uniqueFileName =
                $"{Guid.NewGuid()}{extension}";


            string filePath =
                Path.Combine(
                    uploadFolder,
                    uniqueFileName
                );


            // =================================================
            // SAVE PHYSICAL IMAGE
            // =================================================

            using (
                var stream =
                    new FileStream(
                        filePath,
                        FileMode.Create
                    )
            )
            {
                await image.CopyToAsync(
                    stream
                );
            }


            // =================================================
            // DATABASE PATH
            // =================================================

            string mediaUrl =
                $"/uploads/chat/{uniqueFileName}";


            // IMPORTANT:
            // This path is returned to app.js.
            //
            // app.js then sends this path to ChatHub.
            //
            // ChatHub stores it in Messages.MediaUrl.


            return Ok(new
            {
                mediaUrl = mediaUrl
            });
        }
    }
}