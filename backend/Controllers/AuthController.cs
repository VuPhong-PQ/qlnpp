using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QlnppApi.Data;
using QlnppApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class LoginResponse
        {
            public bool Success { get; set; }
            public string? Token { get; set; }
            public string? Message { get; set; }
            public UserDto? User { get; set; }
            public List<string>? Permissions { get; set; }
        }

        public class UserDto
        {
            public int Id { get; set; }
            public string Username { get; set; } = string.Empty;
            public string? Name { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
            public string? AvatarUrl { get; set; }
            public string? Position { get; set; }
            public bool IsInactive { get; set; }
        }

        public class ChangePasswordRequest
        {
            public int UserId { get; set; }
            public string OldPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                {
                    return Ok(new LoginResponse { Success = false, Message = "Tên đăng nhập và mật khẩu không được để trống" });
                }

                var user = await _db.Users
                    .Include(u => u.Permissions)
                    .FirstOrDefaultAsync(u => u.Username == request.Username);

                if (user == null)
                {
                    return Ok(new LoginResponse { Success = false, Message = "Tên đăng nhập không tồn tại" });
                }

                if (user.IsInactive)
                {
                    return Ok(new LoginResponse { Success = false, Message = "Tài khoản đã bị vô hiệu hóa" });
                }

                // Verify password
                if (!VerifyPassword(request.Password, user.PasswordHash ?? ""))
                {
                    return Ok(new LoginResponse { Success = false, Message = "Mật khẩu không chính xác" });
                }

                // Generate JWT token
                var token = GenerateJwtToken(user);

                // Get user permissions
                var permissions = await GetUserPermissions(user.Id);

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Name = user.Name,
                    Email = user.Email,
                    Phone = user.Phone,
                    AvatarUrl = user.AvatarUrl,
                    Position = user.Position,
                    IsInactive = user.IsInactive
                };

                return Ok(new LoginResponse
                {
                    Success = true,
                    Token = token,
                    User = userDto,
                    Permissions = permissions,
                    Message = "Đăng nhập thành công"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new LoginResponse { Success = false, Message = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            try
            {
                if (string.IsNullOrEmpty(user.Username))
                {
                    return BadRequest(new { success = false, message = "Tên đăng nhập không được để trống" });
                }

                var exists = await _db.Users.AnyAsync(u => u.Username == user.Username);
                if (exists)
                {
                    return BadRequest(new { success = false, message = "Tên đăng nhập đã tồn tại" });
                }

                // Hash password
                if (!string.IsNullOrEmpty(user.PasswordHash))
                {
                    user.PasswordHash = HashPassword(user.PasswordHash);
                }

                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                return Ok(new { success = true, message = "Đăng ký thành công", userId = user.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var user = await _db.Users.FindAsync(request.UserId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                if (!VerifyPassword(request.OldPassword, user.PasswordHash ?? ""))
                {
                    return BadRequest(new { success = false, message = "Mật khẩu cũ không chính xác" });
                }

                user.PasswordHash = HashPassword(request.NewPassword);
                await _db.SaveChangesAsync();

                return Ok(new { success = true, message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("reset-password/{userId}")]
        public async Task<IActionResult> ResetPassword(int userId)
        {
            try
            {
                var user = await _db.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                // Reset to default password "123456"
                user.PasswordHash = HashPassword("123456");
                await _db.SaveChangesAsync();

                return Ok(new { success = true, message = "Mật khẩu đã được đặt lại thành '123456'" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("current-user")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
                }

                var userId = int.Parse(userIdClaim.Value);
                var user = await _db.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                var permissions = await GetUserPermissions(userId);

                return Ok(new
                {
                    success = true,
                    user = new UserDto
                    {
                        Id = user.Id,
                        Username = user.Username,
                        Name = user.Name,
                        Email = user.Email,
                        Phone = user.Phone,
                        AvatarUrl = user.AvatarUrl,
                        Position = user.Position,
                        IsInactive = user.IsInactive
                    },
                    permissions
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("permissions/{userId}")]
        public async Task<IActionResult> GetUserPermissionsApi(int userId)
        {
            try
            {
                var permissions = await GetUserPermissions(userId);
                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private async Task<List<string>> GetUserPermissions(int userId)
        {
            var permissions = new List<string>();

            // Check if user is superadmin or admin - grant all permissions
            var user = await _db.Users.FindAsync(userId);
            if (user != null && (user.Username == "superadmin" || user.Username == "admin"))
            {
                // Return all permissions for superadmin and admin
                // Use underscore format to match frontend (e.g., company_info, customer_groups)
                var allResources = new[] {
                    // Dashboard
                    "dashboard",
                    // Thiết lập ban đầu (Setup)
                    "company_info", "accounts_funds", "customer_groups", "customers", "suppliers",
                    "product_categories", "products", "units", "transaction_contents", "warehouses", "vehicles",
                    // Quản lý nghiệp vụ (Business)
                    "quotations", "imports", "exports", "warehouse_transfers", "orders",
                    "sale_management", "print_order", "receipt_voucher", "expense_voucher",
                    "cost_calculation", "adjustments", "returns",
                    // Báo cáo thống kê (Reports)
                    "sales_report", "inventory_report", "financial_report", "reports",
                    // Admin
                    "manage_data", "permission_groups", "user_permissions", "users"
                };
                var allActions = new[] { "view", "add", "edit", "delete", "print", "import", "export" };

                foreach (var resource in allResources)
                {
                    foreach (var action in allActions)
                    {
                        permissions.Add($"{resource}:{action}");
                    }
                }

                // Add special admin permission
                permissions.Add("admin:full-access");
                
                return permissions;
            }

            // Get direct user permissions
            var userPerms = await _db.UserPermissions
                .Where(up => up.UserId == userId)
                .ToListAsync();

            foreach (var perm in userPerms)
            {
                if (perm.CanView) permissions.Add($"{perm.ResourceKey}:view");
                if (perm.CanAdd) permissions.Add($"{perm.ResourceKey}:add");
                if (perm.CanEdit) permissions.Add($"{perm.ResourceKey}:edit");
                if (perm.CanDelete) permissions.Add($"{perm.ResourceKey}:delete");
                if (perm.CanPrint) permissions.Add($"{perm.ResourceKey}:print");
                if (perm.CanImport) permissions.Add($"{perm.ResourceKey}:import");
                if (perm.CanExport) permissions.Add($"{perm.ResourceKey}:export");
            }

            // Get permissions from user's permission groups
            var groupIds = await _db.UserPermissionGroups
                .Where(upg => upg.UserId == userId)
                .Select(upg => upg.PermissionGroupId)
                .ToListAsync();

            var groupPerms = await _db.PermissionGroupDetails
                .Where(pgd => groupIds.Contains(pgd.PermissionGroupId))
                .ToListAsync();

            foreach (var perm in groupPerms)
            {
                if (perm.CanView) permissions.Add($"{perm.ResourceKey}:view");
                if (perm.CanAdd) permissions.Add($"{perm.ResourceKey}:add");
                if (perm.CanEdit) permissions.Add($"{perm.ResourceKey}:edit");
                if (perm.CanDelete) permissions.Add($"{perm.ResourceKey}:delete");
                if (perm.CanPrint) permissions.Add($"{perm.ResourceKey}:print");
                if (perm.CanImport) permissions.Add($"{perm.ResourceKey}:import");
                if (perm.CanExport) permissions.Add($"{perm.ResourceKey}:export");
            }

            return permissions.Distinct().ToList();
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "YourSuperSecretKeyForQlnppApiThatIsAtLeast32Characters";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "QlnppApi";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "QlnppClient";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim("name", user.Name ?? ""),
                new Claim("position", user.Position ?? "")
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            // Use hex string format (same as Program.cs seed)
            var builder = new StringBuilder();
            for (int i = 0; i < hashedBytes.Length; i++)
            {
                builder.Append(hashedBytes[i].ToString("x2"));
            }
            return builder.ToString();
        }

        private bool VerifyPassword(string password, string hash)
        {
            // Support plain text password for backward compatibility
            if (password == hash) return true;
            
            var hashedPassword = HashPassword(password);
            if (hashedPassword == hash) return true;
            
            // Also support Base64 format for backward compatibility
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            var base64Hash = Convert.ToBase64String(hashedBytes);
            return base64Hash == hash;
        }
    }
}
