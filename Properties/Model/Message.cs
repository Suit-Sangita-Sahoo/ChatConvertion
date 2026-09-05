using System;
using System.ComponentModel.DataAnnotations;

namespace RealTimeChat.Models
{
    public class Message
    {
        [Key]
        public int Id { get; set; }

        public int SenderId { get; set; }

        public int ReceiverId { get; set; }

        public string? Content { get; set; }

        public string MessageType { get; set; } = "Text";

        public string? MediaUrl { get; set; }

        public string Status { get; set; } = "Sent";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}