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
    public class QuotationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QuotationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Quotations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Quotation>>> Get()
        {
            var list = await _context.Quotations.OrderByDescending(q => q.Date).ToListAsync();
            return Ok(list);
        }

        // GET: api/Quotations/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Quotation>> Get(int id)
        {
            try
            {
                var quotation = await _context.Quotations.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
                if (quotation == null) return NotFound();
                return Ok(quotation);
            }
            catch (System.Exception ex)
            {
                // Return problem details in development to help debugging
                return Problem(detail: ex.ToString(), title: "Load quotation details error");
            }
        }

        // POST: api/Quotations
        [HttpPost]
        public async Task<ActionResult<Quotation>> Post(Quotation model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            // detach any nested ids to ensure insert
            if (model.Items != null)
            {
                foreach (var it in model.Items)
                {
                    it.Id = 0;
                }
            }
            _context.Quotations.Add(model);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        // PUT: api/Quotations/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, Quotation model)
        {
            try
            {
                if (id != model.Id) return BadRequest();
                var existing = await _context.Quotations.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
                if (existing == null) return NotFound();

                // update header
                existing.Code = model.Code;
                existing.Date = model.Date;
                existing.QuotationType = model.QuotationType;
                existing.Note = model.Note;
                existing.Employee = model.Employee;
                existing.Total = model.Total;

                // replace items: simple approach - remove existing and add new
                _context.QuotationItems.RemoveRange(existing.Items);
                if (model.Items != null && model.Items.Any())
                {
                    foreach (var it in model.Items)
                    {
                        it.Id = 0;
                        it.QuotationId = existing.Id;
                    }
                    await _context.QuotationItems.AddRangeAsync(model.Items);
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return Problem(detail: ex.ToString(), title: "Save quotation error");
            }
        }

        // DELETE: api/Quotations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.Quotations.FindAsync(id);
            if (existing == null) return NotFound();
            _context.Quotations.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
