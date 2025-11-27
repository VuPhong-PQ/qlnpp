using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;
using ClosedXML.Excel;
using System.IO;
using System.Linq;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehousesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WarehousesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Warehouses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Warehouse>>> GetWarehouses()
        {
            return await _context.Warehouses.ToListAsync();
        }

        // GET: api/Warehouses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Warehouse>> GetWarehouse(int id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);

            if (warehouse == null)
            {
                return NotFound();
            }

            return warehouse;
        }

        // POST: api/Warehouses
        [HttpPost]
        public async Task<ActionResult<Warehouse>> PostWarehouse(Warehouse warehouse)
        {
            _context.Warehouses.Add(warehouse);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouse);
        }

        // PUT: api/Warehouses/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarehouse(int id, Warehouse warehouse)
        {
            if (id != warehouse.Id)
            {
                return BadRequest();
            }

            _context.Entry(warehouse).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarehouseExists(id))
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

        // DELETE: api/Warehouses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouse(int id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null)
            {
                return NotFound();
            }

            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Warehouses/export
        [HttpGet("export")]
        public async Task<IActionResult> ExportWarehouses()
        {
            var list = await _context.Warehouses.AsNoTracking().ToListAsync();

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("Warehouses");

            // Header
            ws.Cell(1, 1).Value = "Mã";
            ws.Cell(1, 2).Value = "Tên";
            ws.Cell(1, 3).Value = "Địa chỉ";
            ws.Cell(1, 4).Value = "Người quản lý";
            ws.Cell(1, 5).Value = "Điện thoại";
            ws.Cell(1, 6).Value = "Ghi chú";
            ws.Cell(1, 7).Value = "Trạng thái";

            // Data
            var row = 2;
            foreach (var w in list)
            {
                ws.Cell(row, 1).Value = w.Code;
                ws.Cell(row, 2).Value = w.Name;
                ws.Cell(row, 3).Value = w.Address;
                ws.Cell(row, 4).Value = w.Manager;
                ws.Cell(row, 5).Value = w.Phone;
                ws.Cell(row, 6).Value = w.Note;
                ws.Cell(row, 7).Value = w.Status;
                row++;
            }

            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            ms.Seek(0, SeekOrigin.Begin);

            var contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            var fileName = "warehouses.xlsx";
            return File(ms.ToArray(), contentType, fileName);
        }

        // POST: api/Warehouses/import
        [HttpPost("import")]
        public async Task<IActionResult> ImportWarehouses(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Seek(0, SeekOrigin.Begin);

            using var wb = new XLWorkbook(stream);
            var ws = wb.Worksheets.First();

            // Assume header is in first row
            var range = ws.RangeUsed();
            if (range == null) return BadRequest("Empty or invalid Excel file.");
            var rows = range.RowsUsed().Skip(1);
            var imported = new List<Warehouse>();

            foreach (var r in rows)
            {
                try
                {
                    var code = r.Cell(1).GetString().Trim();
                    if (string.IsNullOrEmpty(code)) continue; // skip empty

                    var name = r.Cell(2).GetString().Trim();
                    var address = r.Cell(3).GetString().Trim();
                    var manager = r.Cell(4).GetString().Trim();
                    var phone = r.Cell(5).GetString().Trim();
                    var note = r.Cell(6).GetString().Trim();
                    var status = r.Cell(7).GetString().Trim();

                    // If exists by code, update; otherwise insert
                    var existing = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == code);
                    if (existing != null)
                    {
                        existing.Name = name;
                        existing.Address = address;
                        existing.Manager = manager;
                        existing.Phone = phone;
                        existing.Note = note;
                        existing.Status = status;
                        _context.Warehouses.Update(existing);
                    }
                    else
                    {
                        var wh = new Warehouse
                        {
                            Code = code,
                            Name = name,
                            Address = address,
                            Manager = manager,
                            Phone = phone,
                            Note = note,
                            Status = status
                        };
                        await _context.Warehouses.AddAsync(wh);
                        imported.Add(wh);
                    }
                }
                catch
                {
                    // ignore malformed rows
                    continue;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Import completed", imported = imported.Count });
        }

        private bool WarehouseExists(int id)
        {
            return _context.Warehouses.Any(e => e.Id == id);
        }
    }
}
