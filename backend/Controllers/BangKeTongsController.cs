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
    public class BangKeTongsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BangKeTongsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/BangKeTongs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BangKeTong>>> Get()
        {
            var list = await _context.BangKeTongs
                .Include(b => b.Items)
                .Include(b => b.HoaDons)
                .OrderByDescending(b => b.CreatedDate)
                .ThenByDescending(b => b.Id)
                .ToListAsync();
            return Ok(list);
        }

        // GET: api/BangKeTongs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BangKeTong>> Get(int id)
        {
            var item = await _context.BangKeTongs
                .Include(b => b.Items)
                .Include(b => b.HoaDons)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        // POST: api/BangKeTongs
        [HttpPost]
        public async Task<ActionResult<BangKeTong>> Post([FromBody] BangKeTong bangKeTong)
        {
            if (bangKeTong == null)
                return BadRequest("Dữ liệu không hợp lệ");

            _context.BangKeTongs.Add(bangKeTong);
            await _context.SaveChangesAsync();

            // Reload with includes
            var created = await _context.BangKeTongs
                .Include(b => b.Items)
                .Include(b => b.HoaDons)
                .FirstOrDefaultAsync(b => b.Id == bangKeTong.Id);

            return CreatedAtAction(nameof(Get), new { id = bangKeTong.Id }, created);
        }

        // PUT: api/BangKeTongs/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] BangKeTong bangKeTong)
        {
            if (id != bangKeTong.Id)
                return BadRequest("ID không khớp");

            var existing = await _context.BangKeTongs
                .Include(b => b.Items)
                .Include(b => b.HoaDons)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (existing == null)
                return NotFound();

            // Update header fields
            existing.ImportNumber = bangKeTong.ImportNumber;
            existing.CreatedDate = bangKeTong.CreatedDate;
            existing.Employee = bangKeTong.Employee;
            existing.ImportType = bangKeTong.ImportType;
            existing.DsHoaDon = bangKeTong.DsHoaDon;
            existing.Note = bangKeTong.Note;
            existing.TotalAmount = bangKeTong.TotalAmount;

            // Replace items: remove old, add new
            _context.BangKeTongItems.RemoveRange(existing.Items);
            if (bangKeTong.Items != null)
            {
                foreach (var item in bangKeTong.Items)
                {
                    item.Id = 0; // Reset id for new insert
                    item.BangKeTongId = id;
                    existing.Items.Add(item);
                }
            }

            // Replace hoa dons: remove old, add new
            _context.BangKeTongHoaDons.RemoveRange(existing.HoaDons);
            if (bangKeTong.HoaDons != null)
            {
                foreach (var hd in bangKeTong.HoaDons)
                {
                    hd.Id = 0;
                    hd.BangKeTongId = id;
                    existing.HoaDons.Add(hd);
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/BangKeTongs/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.BangKeTongs.FindAsync(id);
            if (item == null)
                return NotFound();

            _context.BangKeTongs.Remove(item); // Cascade deletes items & hoadons
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
