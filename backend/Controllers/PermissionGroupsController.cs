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
        public async Task<IActionResult> Create([FromBody] PermissionGroupDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrEmpty(dto.Name))
                    return BadRequest(new { error = "Tên nhóm quyền không được để trống" });

                var group = new PermissionGroup
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    IsActive = dto.IsActive
                };

                // Add permission details
                if (dto.PermissionDetails != null)
                {
                    foreach (var pd in dto.PermissionDetails)
                    {
                        group.PermissionDetails.Add(new PermissionGroupDetail
                        {
                            ResourceKey = pd.ResourceKey ?? "",
                            ResourceName = pd.ResourceName,
                            CanView = pd.CanView,
                            CanAdd = pd.CanAdd,
                            CanEdit = pd.CanEdit,
                            CanDelete = pd.CanDelete,
                            CanPrint = pd.CanPrint,
                            CanImport = pd.CanImport,
                            CanExport = pd.CanExport
                        });
                    }
                }

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
        public async Task<IActionResult> Update(int id, [FromBody] PermissionGroupDto dto)
        {
            if (dto == null)
                return BadRequest();

            var exists = await _db.PermissionGroups
                .Include(pg => pg.PermissionDetails)
                .FirstOrDefaultAsync(pg => pg.Id == id);
            
            if (exists == null)
                return NotFound();

            exists.Name = dto.Name ?? exists.Name;
            exists.Description = dto.Description;
            exists.IsActive = dto.IsActive;

            // Update permission details
            if (dto.PermissionDetails != null)
            {
                // Remove existing details
                _db.PermissionGroupDetails.RemoveRange(exists.PermissionDetails);
                
                // Add new details
                foreach (var pd in dto.PermissionDetails)
                {
                    exists.PermissionDetails.Add(new PermissionGroupDetail
                    {
                        PermissionGroupId = id,
                        ResourceKey = pd.ResourceKey ?? "",
                        ResourceName = pd.ResourceName,
                        CanView = pd.CanView,
                        CanAdd = pd.CanAdd,
                        CanEdit = pd.CanEdit,
                        CanDelete = pd.CanDelete,
                        CanPrint = pd.CanPrint,
                        CanImport = pd.CanImport,
                        CanExport = pd.CanExport
                    });
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

    // DTO classes for JSON binding
    public class PermissionGroupDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public List<PermissionDetailDto>? PermissionDetails { get; set; }
    }

    public class PermissionDetailDto
    {
        public string? ResourceKey { get; set; }
        public string? ResourceName { get; set; }
        public bool CanView { get; set; }
        public bool CanAdd { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanPrint { get; set; }
        public bool CanImport { get; set; }
        public bool CanExport { get; set; }
    }
}
