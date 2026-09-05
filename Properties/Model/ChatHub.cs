using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RealTimeChat.Data;
using RealTimeChat.Models;

namespace RealTimeChat.Hubs
{
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(
            AppDbContext context,
            ILogger<ChatHub> logger)
        {
            _context = context;
            _logger = logger;
        }


        // =====================================================
        // SEND TEXT MESSAGE
        // =====================================================

        public async Task SendMessage(
            int senderId,
            int receiverId,
            string content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                throw new HubException(
                    "Message cannot be empty."
                );
            }

            bool senderExists =
                await _context.Users
                    .AnyAsync(u => u.Id == senderId);

            if (!senderExists)
            {
                throw new HubException(
                    "Sender does not exist."
                );
            }

            bool receiverExists =
                await _context.Users
                    .AnyAsync(u => u.Id == receiverId);

            if (!receiverExists)
            {
                throw new HubException(
                    "Receiver does not exist."
                );
            }


            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                MessageType = "Text",
                MediaUrl = null,
                Status = "Sent",
                CreatedAt = DateTime.UtcNow
            };


            _context.Messages.Add(message);

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "TEXT MESSAGE SAVED: ID={Id}, Sender={Sender}, Receiver={Receiver}",
                message.Id,
                message.SenderId,
                message.ReceiverId
            );


            await Clients.All.SendAsync(
                "ReceiveMessage",
                new
                {
                    id = message.Id,
                    senderId = message.SenderId,
                    receiverId = message.ReceiverId,
                    content = message.Content,
                    messageType = message.MessageType,
                    mediaUrl = message.MediaUrl,
                    status = message.Status,
                    createdAt = message.CreatedAt
                }
            );
        }


        // =====================================================
        // SEND IMAGE MESSAGE
        // =====================================================

        public async Task SendImageMessage(
            int senderId,
            int receiverId,
            string mediaUrl)
        {
            // -------------------------------------------------
            // LOG WHAT IS RECEIVED FROM APP.JS
            // -------------------------------------------------

            _logger.LogInformation(
                "IMAGE REQUEST RECEIVED: Sender={Sender}, Receiver={Receiver}, MediaUrl={MediaUrl}",
                senderId,
                receiverId,
                mediaUrl
            );


            // -------------------------------------------------
            // Validate URL
            // -------------------------------------------------

            if (string.IsNullOrWhiteSpace(mediaUrl))
            {
                _logger.LogError(
                    "IMAGE URL IS EMPTY!"
                );

                throw new HubException(
                    "Image URL is empty."
                );
            }


            // -------------------------------------------------
            // Validate sender
            // -------------------------------------------------

            bool senderExists =
                await _context.Users
                    .AnyAsync(
                        u => u.Id == senderId
                    );


            if (!senderExists)
            {
                throw new HubException(
                    "Sender does not exist."
                );
            }


            // -------------------------------------------------
            // Validate receiver
            // -------------------------------------------------

            bool receiverExists =
                await _context.Users
                    .AnyAsync(
                        u => u.Id == receiverId
                    );


            if (!receiverExists)
            {
                throw new HubException(
                    "Receiver does not exist."
                );
            }


            // =================================================
            // CREATE MESSAGE
            // =================================================

            var message = new Message
            {
                SenderId = senderId,

                ReceiverId = receiverId,

                Content = null,

                MessageType = "Image",

                MediaUrl = mediaUrl,

                Status = "Sent",

                CreatedAt = DateTime.UtcNow
            };


            // =================================================
            // ADD TO EF CORE
            // =================================================

            _context.Messages.Add(message);


            // =================================================
            // SAVE TO MYSQL
            // =================================================

            await _context.SaveChangesAsync();


            // =================================================
            // VERIFY DATABASE OBJECT
            // =================================================

            _logger.LogInformation(
                "IMAGE MESSAGE SAVED SUCCESSFULLY: ID={Id}, MediaUrl={MediaUrl}",
                message.Id,
                message.MediaUrl
            );


            // =================================================
            // SEND TO FRONTEND
            // =================================================

            await Clients.All.SendAsync(
                "ReceiveMessage",
                new
                {
                    id = message.Id,

                    senderId = message.SenderId,

                    receiverId = message.ReceiverId,

                    content = message.Content,

                    messageType = message.MessageType,

                    mediaUrl = message.MediaUrl,

                    status = message.Status,

                    createdAt = message.CreatedAt
                }
            );
        }


        // =====================================================
        // TYPING
        // =====================================================

        public async Task Typing(
            int senderId,
            int receiverId)
        {
            await Clients.All.SendAsync(
                "UserTyping",
                senderId
            );
        }
    }
}