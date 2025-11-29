using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/users/{userId}/[controller]")]
    [ApiController]
    public class PermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public PermissionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/users/{userId}/permissions
        [HttpGet]
        public async Task<IActionResult> GetForUser(int userId)
        {
            try 
            {
                var user = await _db.Users.FindAsync(userId);
                if (user == null) return NotFound();

                var perms = await _db.UserPermissions
                    .Where(p => p.UserId == userId)
                    .Select(p => new {
                        p.Id,
                        p.UserId,
                        p.ResourceKey,
                        p.CanView,
                        p.CanAdd,
                        p.CanEdit,
                        p.CanDelete,
                        p.CanPrint,
                        p.CanImport,
                        p.CanExport
                    })
                    .ToListAsync();

                return Ok(perms);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // PUT: api/users/{userId}/permissions
        [HttpPut]
        public async Task<IActionResult> UpdateForUser(int userId, [FromBody] PermissionUpdateModel model)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            // clear existing
            var existing = _db.UserPermissions.Where(p => p.UserId == userId);
            _db.UserPermissions.RemoveRange(existing);

            // add new
            if (model?.Permissions != null)
            {
                foreach (var kv in model.Permissions)
                {
                    var resource = kv.Key;
                    var item = kv.Value;
                    var up = new UserPermission
                    {
                        UserId = userId,
                        ResourceKey = resource,
                        CanView = item.CanView,
                        CanAdd = item.CanAdd,
                        CanEdit = item.CanEdit,
                        CanDelete = item.CanDelete,
                        CanPrint = item.CanPrint,
                        CanImport = item.CanImport,
                        CanExport = item.CanExport
                    };
                    _db.UserPermissions.Add(up);
                }
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    // Model for update
    public class PermissionUpdateModel
    {
        public Dictionary<string, PermissionDto> Permissions { get; set; }
    }

    public class PermissionDto
    {
        public bool CanView { get; set; }
        public bool CanAdd { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanPrint { get; set; }
        public bool CanImport { get; set; }
        public bool CanExport { get; set; }
    }
}
