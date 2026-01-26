using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehousePermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public WarehousePermissionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserWarehousePermissions(int userId)
        {
            var permissions = await _db.WarehousePermissions
                .Where(wp => wp.UserId == userId)
                .Include(wp => wp.Warehouse)
                .ToListAsync();
            return Ok(permissions);
        }

        [HttpPut("user/{userId}")]
        public async Task<IActionResult> UpdateUserWarehousePermissions(int userId, [FromBody] List<WarehousePermission> permissions)
        {
            try
            {
                // Remove existing permissions
                var existing = await _db.WarehousePermissions
                    .Where(wp => wp.UserId == userId)
                    .ToListAsync();
                _db.WarehousePermissions.RemoveRange(existing);

                // Add new permissions
                foreach (var perm in permissions)
                {
                    perm.UserId = userId;
                    _db.WarehousePermissions.Add(perm);
                }

                await _db.SaveChangesAsync();
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("warehouse/{warehouseId}/users")]
        public async Task<IActionResult> GetUsersWithWarehouseAccess(int warehouseId)
        {
            var users = await _db.WarehousePermissions
                .Where(wp => wp.WarehouseId == warehouseId && wp.CanView)
                .Include(wp => wp.User)
                .Select(wp => wp.User)
                .ToListAsync();
            return Ok(users);
        }
    }
}
