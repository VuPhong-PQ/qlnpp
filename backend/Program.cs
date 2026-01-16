using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Backup settings and background service
builder.Services.Configure<QlnppApi.Models.BackupSettings>(builder.Configuration.GetSection("BackupSettings"));
builder.Services.AddSingleton<QlnppApi.Services.BackupService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<QlnppApi.Services.BackupService>());

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// Add controllers with JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Use CORS
app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

// Seed default superadmin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<ApplicationDbContext>();
    try
    {
        // Try apply migrations if possible; ignore warnings/errors about pending model changes
        db.Database.Migrate();
    }
    catch (Exception migrateEx)
    {
        Console.WriteLine("Migration attempt failed (ignored): " + migrateEx.Message);
    }

    try
    {
        if (db.Database.CanConnect())
        {
            var exists = db.Users.Any(u => u.Username == "superadmin");
            if (!exists)
            {
                var user = new User
                {
                    Username = "superadmin",
                    PasswordHash = ComputeSha256Hash("vuphong"),
                    Name = "Super Admin",
                    Email = null,
                    Phone = null,
                    IsInactive = false
                };
                db.Users.Add(user);
                db.SaveChanges();
                Console.WriteLine("Seeded default superadmin user.");
            }
        }
    }
    catch (Exception ex)
    {
        // Log to console if seeding fails
        Console.WriteLine("Error seeding default user: " + ex.Message);
    }
}

app.Run();

static string ComputeSha256Hash(string rawData)
{
    // Create a SHA256
    using (var sha256Hash = SHA256.Create())
    {
        // ComputeHash - returns byte array
        byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));

        // Convert byte array to a string
        var builder = new StringBuilder();
        for (int i = 0; i < bytes.Length; i++)
        {
            builder.Append(bytes[i].ToString("x2"));
        }
        return builder.ToString();
    }
}

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
