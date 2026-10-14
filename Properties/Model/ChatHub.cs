using Microsoft.AspNetCore.SignalR;
using RealTimeChat.Data;
using RealTimeChat.Models;

namespace RealTimeChat.Hubs
{
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        // Send text message
        public async Task SendMessage(
            int senderId,
            int receiverId,
            string content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return;
            }

            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                MessageType = "Text",
                Status = "Sent",
                CreatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Send to receiver's group (connections registered for receiverId)
            await Clients.Group(receiverId.ToString())
                .SendAsync("ReceiveMessage", message);

            // Also send via SignalR User identifier if configured
            await Clients.User(receiverId.ToString())
                .SendAsync("ReceiveMessage", message);

            // Send back to the caller (sender)
            await Clients.Caller
                .SendAsync("ReceiveMessage", message);
        }

        // Send image message
        public async Task SendImageMessage(
            int senderId,
            int receiverId,
            string mediaUrl)
        {
            if (string.IsNullOrWhiteSpace(mediaUrl))
            {
                return;
            }

            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                MediaUrl = mediaUrl,
                MessageType = "Image",
                Status = "Sent",
                CreatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Send to receiver's group
            await Clients.Group(receiverId.ToString())
                .SendAsync("ReceiveMessage", message);

            // Send via SignalR User
            await Clients.User(receiverId.ToString())
                .SendAsync("ReceiveMessage", message);

            // Send back to caller
            await Clients.Caller
                .SendAsync("ReceiveMessage", message);
        }

        // Typing indicator
        public async Task Typing(
            int senderId,
            int receiverId)
        {
            await Clients.Group(receiverId.ToString())
                .SendAsync("UserTyping", senderId, receiverId);

            await Clients.User(receiverId.ToString())
                .SendAsync("UserTyping", senderId, receiverId);
        }

        // Register current user connection to their personal group
        public async Task RegisterUser(int userId)
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                userId.ToString()
            );
        }

        // Remove user connection
        public async Task Logout(int userId)
        {
            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId,
                userId.ToString()
            );
        }

        public override async Task OnDisconnectedAsync(
            Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}