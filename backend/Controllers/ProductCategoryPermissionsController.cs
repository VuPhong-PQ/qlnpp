using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductCategoryPermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ProductCategoryPermissionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserProductCategoryPermissions(int userId)
        {
            var permissions = await _db.ProductCategoryPermissions
                .Where(pcp => pcp.UserId == userId)
                .Include(pcp => pcp.ProductCategory)
                .ToListAsync();
            return Ok(permissions);
        }

        [HttpPut("user/{userId}")]
        public async Task<IActionResult> UpdateUserProductCategoryPermissions(int userId, [FromBody] List<ProductCategoryPermission> permissions)
        {
            try
            {
                // Remove existing permissions
                var existing = await _db.ProductCategoryPermissions
                    .Where(pcp => pcp.UserId == userId)
                    .ToListAsync();
                _db.ProductCategoryPermissions.RemoveRange(existing);

                // Add new permissions
                foreach (var perm in permissions)
                {
                    perm.UserId = userId;
                    _db.ProductCategoryPermissions.Add(perm);
                }

                await _db.SaveChangesAsync();
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("category/{categoryId}/users")]
        public async Task<IActionResult> GetUsersWithCategoryAccess(int categoryId)
        {
            var users = await _db.ProductCategoryPermissions
                .Where(pcp => pcp.ProductCategoryId == categoryId && pcp.CanView)
                .Include(pcp => pcp.User)
                .Select(pcp => pcp.User)
                .ToListAsync();
            return Ok(users);
        }
    }
}
