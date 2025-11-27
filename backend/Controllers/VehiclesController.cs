using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;
using ClosedXML.Excel;
using System.IO;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehiclesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VehiclesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Vehicles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles()
        {
            return await _context.Vehicles.ToListAsync();
        }

        // GET: api/Vehicles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetVehicle(int id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);

            if (vehicle == null)
            {
                return NotFound();
            }

            return vehicle;
        }

        // POST: api/Vehicles
        [HttpPost]
        public async Task<ActionResult<Vehicle>> PostVehicle(Vehicle vehicle)
        {
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, vehicle);
        }

        // PUT: api/Vehicles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehicle(int id, Vehicle vehicle)
        {
            if (id != vehicle.Id)
            {
                return BadRequest();
            }

            _context.Entry(vehicle).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VehicleExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Vehicles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null)
            {
                return NotFound();
            }

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool VehicleExists(int id)
        {
            return _context.Vehicles.Any(e => e.Id == id);
        }

        // GET: api/Vehicles/export
        [HttpGet("export")]
        public async Task<IActionResult> ExportVehicles()
        {
            var list = await _context.Vehicles.AsNoTracking().ToListAsync();

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("Vehicles");

            // Header
            ws.Cell(1, 1).Value = "Mã";
            ws.Cell(1, 2).Value = "Biển số";
            ws.Cell(1, 3).Value = "Tên";
            ws.Cell(1, 4).Value = "Trọng tải";
            ws.Cell(1, 5).Value = "Số khối";
            ws.Cell(1, 6).Value = "Năm mua";
            ws.Cell(1, 7).Value = "Trị giá";
            ws.Cell(1, 8).Value = "Số tháng khấu hao";
            ws.Cell(1, 9).Value = "Trị giá khấu hao";
            ws.Cell(1, 10).Value = "Ghi chú";
            ws.Cell(1, 11).Value = "Trạng thái";

            var row = 2;
            foreach (var v in list)
            {
                ws.Cell(row, 1).Value = v.Code;
                ws.Cell(row, 2).Value = v.LicensePlate;
                ws.Cell(row, 3).Value = v.Name;
                ws.Cell(row, 4).Value = v.LoadCapacity;
                ws.Cell(row, 5).Value = v.Volume;
                ws.Cell(row, 6).Value = v.PurchaseYear;
                ws.Cell(row, 7).Value = v.PurchasePrice;
                ws.Cell(row, 8).Value = v.DepreciationMonths;
                ws.Cell(row, 9).Value = v.DepreciationValue;
                ws.Cell(row, 10).Value = v.Note;
                ws.Cell(row, 11).Value = v.Status;
                row++;
            }

            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            ms.Seek(0, SeekOrigin.Begin);

            var contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            var fileName = "vehicles.xlsx";
            return File(ms.ToArray(), contentType, fileName);
        }

        // POST: api/Vehicles/import
        [HttpPost("import")]
        public async Task<IActionResult> ImportVehicles(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Seek(0, SeekOrigin.Begin);

            using var wb = new XLWorkbook(stream);
            var ws = wb.Worksheets.First();

            var range = ws.RangeUsed();
            if (range == null) return BadRequest("Empty or invalid Excel file.");
            var rows = range.RowsUsed().Skip(1);
            var imported = new List<Vehicle>();

            foreach (var r in rows)
            {
                try
                {
                    var code = r.Cell(1).GetString().Trim();
                    if (string.IsNullOrEmpty(code)) continue;
                    var license = r.Cell(2).GetString().Trim();
                    var name = r.Cell(3).GetString().Trim();
                    
                    // Safe parsing with fallback values
                    var load = r.Cell(4).IsEmpty() ? 0m : Convert.ToDecimal(r.Cell(4).GetDouble());
                    var vol = r.Cell(5).IsEmpty() ? 0m : Convert.ToDecimal(r.Cell(5).GetDouble());
                    var year = r.Cell(6).IsEmpty() ? DateTime.Now.Year : Convert.ToInt32(r.Cell(6).GetDouble());
                    var price = r.Cell(7).IsEmpty() ? 0m : Convert.ToDecimal(r.Cell(7).GetDouble());
                    var depMonths = r.Cell(8).IsEmpty() ? 0 : Convert.ToInt32(r.Cell(8).GetDouble());
                    var depValue = r.Cell(9).IsEmpty() ? 0m : Convert.ToDecimal(r.Cell(9).GetDouble());
                    var note = r.Cell(10).GetString().Trim();
                    var status = r.Cell(11).GetString().Trim();

                    var existing = await _context.Vehicles.FirstOrDefaultAsync(v => v.Code == code);
                    if (existing != null)
                    {
                        existing.LicensePlate = license;
                        existing.Name = name;
                        existing.LoadCapacity = load;
                        existing.Volume = vol;
                        existing.PurchaseYear = year;
                        existing.PurchasePrice = price;
                        existing.DepreciationMonths = depMonths;
                        existing.DepreciationValue = depValue;
                        existing.Note = note;
                        existing.Status = status;
                        _context.Vehicles.Update(existing);
                    }
                    else
                    {
                        var v = new Vehicle
                        {
                            Code = code,
                            LicensePlate = license,
                            Name = name,
                            LoadCapacity = load,
                            Volume = vol,
                            PurchaseYear = year,
                            PurchasePrice = price,
                            DepreciationMonths = depMonths,
                            DepreciationValue = depValue,
                            Note = note,
                            Status = status
                        };
                        await _context.Vehicles.AddAsync(v);
                        imported.Add(v);
                    }
                }
                catch (Exception ex)
                {
                    // Log the error for debugging but continue processing
                    Console.WriteLine($"Error processing row: {ex.Message}");
                    continue;
                }
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Import completed successfully. {imported.Count} vehicles imported.", imported = imported.Count });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error saving to database: {ex.Message}");
            }
        }
    }
}
