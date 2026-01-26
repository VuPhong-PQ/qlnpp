using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;
using System.Security.Cryptography;
using System.Text;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public UsersController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _db.Users.AsNoTracking().ToListAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] User user)
        {
            try 
            {
                if (user == null) 
                    return BadRequest(new { error = "User data is required" });
                
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Hash password if provided
                if (!string.IsNullOrEmpty(user.PasswordHash))
                {
                    user.PasswordHash = HashPasswordHex(user.PasswordHash);
                }

                _db.Users.Add(user);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(Get), new { id = user.Id }, user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] User user)
        {
            if (user == null || id != user.Id) return BadRequest();
            var exists = await _db.Users.FindAsync(id);
            if (exists == null) return NotFound();

            exists.Username = user.Username;
            exists.Name = user.Name;
            exists.Email = user.Email;
            exists.Phone = user.Phone;
            exists.AvatarUrl = user.AvatarUrl;
            exists.BirthYear = user.BirthYear;
            exists.IdNumber = user.IdNumber;
            exists.IdIssuedDate = user.IdIssuedDate;
            exists.IdIssuedPlace = user.IdIssuedPlace;
            exists.YearStarted = user.YearStarted;
            exists.Position = user.Position;
            exists.Note = user.Note;
            exists.IsInactive = user.IsInactive;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
        {
            try
            {
                var user = await _db.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                if (string.IsNullOrEmpty(request.NewPassword))
                {
                    return BadRequest(new { success = false, message = "Mật khẩu mới không được để trống" });
                }

                if (request.NewPassword.Length < 4)
                {
                    return BadRequest(new { success = false, message = "Mật khẩu phải có ít nhất 4 ký tự" });
                }

                // Hash the new password using hex format (same as seed data)
                user.PasswordHash = HashPasswordHex(request.NewPassword);
                await _db.SaveChangesAsync();

                return Ok(new { success = true, message = $"Đã đặt lại mật khẩu cho người dùng {user.Username}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private static string HashPasswordHex(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            var sb = new StringBuilder();
            foreach (var b in bytes)
            {
                sb.Append(b.ToString("x2"));
            }
            return sb.ToString();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var exists = await _db.Users.FindAsync(id);
            if (exists == null) return NotFound();
            _db.Users.Remove(exists);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    public class ResetPasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
    }
}
