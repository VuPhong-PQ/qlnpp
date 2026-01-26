using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportPermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ReportPermissionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // Danh sách các báo cáo trong hệ thống
        private static readonly List<object> AvailableReports = new List<object>
        {
            new { Key = "report_sales", Name = "Báo cáo bán hàng", Category = "sales" },
            new { Key = "report_sales_by_customer", Name = "Báo cáo bán hàng theo khách hàng", Category = "sales" },
            new { Key = "report_sales_by_product", Name = "Báo cáo bán hàng theo sản phẩm", Category = "sales" },
            new { Key = "report_sales_by_employee", Name = "Báo cáo bán hàng theo nhân viên", Category = "sales" },
            new { Key = "report_revenue", Name = "Báo cáo doanh thu", Category = "revenue" },
            new { Key = "report_revenue_by_day", Name = "Báo cáo doanh thu theo ngày", Category = "revenue" },
            new { Key = "report_revenue_by_month", Name = "Báo cáo doanh thu theo tháng", Category = "revenue" },
            new { Key = "report_inventory", Name = "Báo cáo tồn kho", Category = "inventory" },
            new { Key = "report_inventory_by_warehouse", Name = "Báo cáo tồn kho theo kho", Category = "inventory" },
            new { Key = "report_inventory_movement", Name = "Báo cáo xuất nhập tồn", Category = "inventory" },
            new { Key = "report_purchase", Name = "Báo cáo mua hàng", Category = "purchase" },
            new { Key = "report_purchase_by_supplier", Name = "Báo cáo mua hàng theo NCC", Category = "purchase" },
            new { Key = "report_debt_customer", Name = "Báo cáo công nợ khách hàng", Category = "debt" },
            new { Key = "report_debt_supplier", Name = "Báo cáo công nợ nhà cung cấp", Category = "debt" },
            new { Key = "report_cashflow", Name = "Báo cáo thu chi", Category = "accounting" },
            new { Key = "report_profit_loss", Name = "Báo cáo lãi lỗ", Category = "accounting" }
        };

        [HttpGet("available")]
        public IActionResult GetAvailableReports()
        {
            return Ok(AvailableReports);
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _db.ReportCategories
                .OrderBy(c => c.SortOrder)
                .ToListAsync();
            return Ok(categories);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserReportPermissions(int userId)
        {
            var permissions = await _db.ReportPermissions
                .Where(rp => rp.UserId == userId)
                .ToListAsync();
            return Ok(permissions);
        }

        [HttpPut("user/{userId}")]
        public async Task<IActionResult> UpdateUserReportPermissions(int userId, [FromBody] List<ReportPermission> permissions)
        {
            try
            {
                // Remove existing permissions
                var existing = await _db.ReportPermissions
                    .Where(rp => rp.UserId == userId)
                    .ToListAsync();
                _db.ReportPermissions.RemoveRange(existing);

                // Add new permissions
                foreach (var perm in permissions)
                {
                    perm.UserId = userId;
                    _db.ReportPermissions.Add(perm);
                }

                await _db.SaveChangesAsync();
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
