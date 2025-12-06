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
    public class ImportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ImportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Imports
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Import>>> Get()
        {
            var list = await _context.Imports.OrderByDescending(i => i.Date).ToListAsync();
            return Ok(list);
        }

        // GET: api/Imports/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Import>> Get(int id)
        {
            try
            {
                var imp = await _context.Imports.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
                if (imp == null) return NotFound();
                return Ok(imp);
            }
            catch (System.Exception ex)
            {
                return Problem(detail: ex.ToString(), title: "Load import details error");
            }
        }

        // POST: api/Imports
        [HttpPost]
        public async Task<ActionResult<Import>> Post(Import model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (model.Items != null)
            {
                foreach (var it in model.Items)
                {
                    it.Id = 0;
                }
            }
            _context.Imports.Add(model);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        // PUT: api/Imports/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, Import model)
        {
            try
            {
                if (id != model.Id) return BadRequest();
                var existing = await _context.Imports.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
                if (existing == null) return NotFound();

                // update header
                existing.ImportNumber = model.ImportNumber;
                existing.Date = model.Date;
                existing.Note = model.Note;
                existing.Employee = model.Employee;
                existing.Total = model.Total;

                // replace items: remove existing and add new
                _context.ImportItems.RemoveRange(existing.Items);
                if (model.Items != null && model.Items.Any())
                {
                    foreach (var it in model.Items)
                    {
                        it.Id = 0;
                        it.ImportId = existing.Id;
                    }
                    await _context.ImportItems.AddRangeAsync(model.Items);
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return Problem(detail: ex.ToString(), title: "Save import error");
            }
        }

        // DELETE: api/Imports/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.Imports.FindAsync(id);
            if (existing == null) return NotFound();
            _context.Imports.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
