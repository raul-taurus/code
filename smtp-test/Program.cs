using System.Net;
using System.Net.Mail;

SmtpClient client = new SmtpClient("smtp.gmail.com", 587);
client.Credentials = new NetworkCredential("test@gmail.com", "****************"); // App password
client.EnableSsl = true;

MailAddress from = new MailAddress("test@gmail.com", "My Test Gmail", System.Text.Encoding.UTF8);
MailAddress to = new MailAddress("test.friend@gmail.com");
MailMessage message = new MailMessage(from, to);

message.IsBodyHtml = true;
message.Body = File.ReadAllText("invitation.html");
message.BodyEncoding = System.Text.Encoding.UTF8;

message.Subject = "test message 1";
message.SubjectEncoding = System.Text.Encoding.UTF8;

Console.WriteLine("Sending message... ");
await client.SendMailAsync(message);

message.Dispose();
Console.WriteLine("Goodbye.");

