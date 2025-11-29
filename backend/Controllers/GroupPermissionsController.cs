using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupPermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public GroupPermissionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/GroupPermissions/{groupId}
        [HttpGet("{groupId}")]
        public async Task<IActionResult> GetForGroup(int groupId)
        {
            var perms = await _db.GroupPermissions.Where(g => g.GroupId == groupId).ToListAsync();
            return Ok(perms);
        }

        // POST: api/GroupPermissions
        // payload: { Group: groupId, Permissions: { resourceKey: { CanView, ... }}}
        [HttpPost]
        public async Task<IActionResult> SavePermissions([FromBody] object body)
        {
            try
            {
                // parse dynamic body
                var doc = System.Text.Json.JsonDocument.Parse(body.ToString());
                if (!doc.RootElement.TryGetProperty("Group", out var groupEl)) return BadRequest("Missing Group");
                var groupId = groupEl.ValueKind == System.Text.Json.JsonValueKind.Number ? groupEl.GetInt32() : (int?)null;
                if (!doc.RootElement.TryGetProperty("Permissions", out var permsEl)) return BadRequest("Missing Permissions");

                // Remove existing permissions for this group
                if (groupId.HasValue)
                {
                    var exists = _db.GroupPermissions.Where(g => g.GroupId == groupId.Value);
                    _db.GroupPermissions.RemoveRange(exists);
                    await _db.SaveChangesAsync();
                }

                foreach (var prop in permsEl.EnumerateObject())
                {
                    var resourceKey = prop.Name;
                    var val = prop.Value;
                    var gp = new GroupPermission
                    {
                        GroupId = groupId,
                        ResourceKey = resourceKey,
                        CanView = val.TryGetProperty("CanView", out var a) && a.GetBoolean(),
                        CanAdd = val.TryGetProperty("CanAdd", out var b) && b.GetBoolean(),
                        CanEdit = val.TryGetProperty("CanEdit", out var c) && c.GetBoolean(),
                        CanDelete = val.TryGetProperty("CanDelete", out var d) && d.GetBoolean(),
                        CanPrint = val.TryGetProperty("CanPrint", out var e) && e.GetBoolean(),
                        CanImport = val.TryGetProperty("CanImport", out var f) && f.GetBoolean(),
                        CanExport = val.TryGetProperty("CanExport", out var g) && g.GetBoolean()
                    };
                    _db.GroupPermissions.Add(gp);
                }

                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (System.Text.Json.JsonException je)
            {
                return BadRequest("Invalid JSON payload: " + je.Message);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
