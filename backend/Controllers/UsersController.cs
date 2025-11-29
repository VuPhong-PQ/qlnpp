using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

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
}
