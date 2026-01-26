using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PermissionGroupsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public PermissionGroupsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var groups = await _db.PermissionGroups
                .Include(pg => pg.PermissionDetails)
                .AsNoTracking()
                .ToListAsync();
            return Ok(groups);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var group = await _db.PermissionGroups
                .Include(pg => pg.PermissionDetails)
                .FirstOrDefaultAsync(pg => pg.Id == id);
            
            if (group == null) return NotFound();
            return Ok(group);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PermissionGroup group)
        {
            try
            {
                if (group == null)
                    return BadRequest(new { error = "Dữ liệu không hợp lệ" });

                _db.PermissionGroups.Add(group);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(Get), new { id = group.Id }, group);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PermissionGroup group)
        {
            if (group == null || id != group.Id)
                return BadRequest();

            var exists = await _db.PermissionGroups
                .Include(pg => pg.PermissionDetails)
                .FirstOrDefaultAsync(pg => pg.Id == id);
            
            if (exists == null)
                return NotFound();

            exists.Name = group.Name;
            exists.Description = group.Description;
            exists.IsActive = group.IsActive;

            // Update permission details
            if (group.PermissionDetails != null)
            {
                // Remove existing details
                _db.PermissionGroupDetails.RemoveRange(exists.PermissionDetails);
                
                // Add new details
                foreach (var detail in group.PermissionDetails)
                {
                    detail.PermissionGroupId = id;
                    _db.PermissionGroupDetails.Add(detail);
                }
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var group = await _db.PermissionGroups.FindAsync(id);
            if (group == null)
                return NotFound();

            _db.PermissionGroups.Remove(group);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}/users")]
        public async Task<IActionResult> GetUsersInGroup(int id)
        {
            var users = await _db.UserPermissionGroups
                .Where(upg => upg.PermissionGroupId == id)
                .Include(upg => upg.User)
                .Select(upg => upg.User)
                .ToListAsync();
            
            return Ok(users);
        }

        [HttpPost("{id}/users/{userId}")]
        public async Task<IActionResult> AddUserToGroup(int id, int userId)
        {
            var exists = await _db.UserPermissionGroups
                .AnyAsync(upg => upg.PermissionGroupId == id && upg.UserId == userId);
            
            if (exists)
                return BadRequest(new { error = "Người dùng đã thuộc nhóm này" });

            _db.UserPermissionGroups.Add(new UserPermissionGroup
            {
                PermissionGroupId = id,
                UserId = userId
            });
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpDelete("{id}/users/{userId}")]
        public async Task<IActionResult> RemoveUserFromGroup(int id, int userId)
        {
            var upg = await _db.UserPermissionGroups
                .FirstOrDefaultAsync(x => x.PermissionGroupId == id && x.UserId == userId);
            
            if (upg == null)
                return NotFound();

            _db.UserPermissionGroups.Remove(upg);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/permissions")]
        public async Task<IActionResult> UpdateGroupPermissions(int id, [FromBody] List<PermissionGroupDetail> permissions)
        {
            var group = await _db.PermissionGroups
                .Include(pg => pg.PermissionDetails)
                .FirstOrDefaultAsync(pg => pg.Id == id);
            
            if (group == null)
                return NotFound();

            // Remove existing permissions
            _db.PermissionGroupDetails.RemoveRange(group.PermissionDetails);

            // Add new permissions
            foreach (var perm in permissions)
            {
                perm.PermissionGroupId = id;
                _db.PermissionGroupDetails.Add(perm);
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}
