using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehouseTransfersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WarehouseTransfersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/WarehouseTransfers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseTransfer>>> Get()
        {
            var list = await _context.WarehouseTransfers
                .Include(t => t.Items)
                .OrderByDescending(t => t.Date)
                .ThenByDescending(t => t.Id)
                .ToListAsync();
            return Ok(list);
        }

        // GET: api/WarehouseTransfers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseTransfer>> Get(int id)
        {
            var t = await _context.WarehouseTransfers.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
            if (t == null) return NotFound();
            return Ok(t);
        }

        // POST: api/WarehouseTransfers
        [HttpPost]
        public async Task<ActionResult<WarehouseTransfer>> Create([FromBody] WarehouseTransfer transfer)
        {
            if (transfer == null) return BadRequest();
            // Basic server-side validation
            if (string.IsNullOrWhiteSpace(transfer.TransferNumber))
            {
                transfer.TransferNumber = GenerateTransferNumber();
            }

            _context.WarehouseTransfers.Add(transfer);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = transfer.Id }, transfer);
        }

        // PUT: api/WarehouseTransfers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] WarehouseTransfer transfer)
        {
            if (id != transfer.Id) return BadRequest();
            var existing = await _context.WarehouseTransfers.Include(t => t.Items).FirstOrDefaultAsync(t => t.Id == id);
            if (existing == null) return NotFound();

            // update header fields
            existing.Date = transfer.Date;
            existing.Employee = transfer.Employee;
            existing.Note = transfer.Note;
            existing.TransferType = transfer.TransferType;
            existing.ImportType = transfer.ImportType;
            existing.ExportType = transfer.ExportType;
            existing.SourceWarehouse = transfer.SourceWarehouse;
            existing.DestWarehouse = transfer.DestWarehouse;
            existing.Total = transfer.Total;
            existing.TotalWeight = transfer.TotalWeight;
            existing.TotalVolume = transfer.TotalVolume;

            // Replace items: simple approach - remove old and add new
            _context.WarehouseTransferItems.RemoveRange(existing.Items);
            existing.Items = transfer.Items ?? new List<WarehouseTransferItem>();

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/WarehouseTransfers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.WarehouseTransfers.FindAsync(id);
            if (existing == null) return NotFound();
            _context.WarehouseTransfers.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private string GenerateTransferNumber()
        {
            // Simple number generator: PT-YYYYMMDD-<random>
            return $"PT-{System.DateTime.Now:yyyyMMdd}-{System.DateTime.Now.Ticks % 10000}";
        }
    }
}
