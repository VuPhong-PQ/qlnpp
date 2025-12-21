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
            try
            {
                if (!ModelState.IsValid) 
                {
                    return BadRequest(ModelState);
                }

                // Set default values if missing
                if (string.IsNullOrEmpty(model.ImportNumber))
                {
                    model.ImportNumber = GenerateImportNumber();
                }

                if (string.IsNullOrEmpty(model.Employee))
                {
                    model.Employee = "System";
                }

                if (string.IsNullOrEmpty(model.Note))
                {
                    model.Note = "";
                }

                // Process items
                if (model.Items != null)
                {
                    foreach (var it in model.Items)
                    {
                        it.Id = 0;
                        it.ImportId = 0; // Will be set automatically
                        
                        // Set default values for required string fields
                        if (string.IsNullOrEmpty(it.Barcode)) it.Barcode = "";
                        if (string.IsNullOrEmpty(it.ProductCode)) it.ProductCode = "";
                        if (string.IsNullOrEmpty(it.ProductName)) it.ProductName = "";
                        if (string.IsNullOrEmpty(it.Description)) it.Description = "";
                        if (string.IsNullOrEmpty(it.Specification)) it.Specification = "";
                        if (string.IsNullOrEmpty(it.Unit)) it.Unit = "";
                        if (string.IsNullOrEmpty(it.Warehouse)) it.Warehouse = "";
                        if (string.IsNullOrEmpty(it.Note)) it.Note = "";
                    }
                }

                _context.Imports.Add(model);
                await _context.SaveChangesAsync();
                
                // Reload with items to return complete object
                var created = await _context.Imports.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == model.Id);
                return CreatedAtAction(nameof(Get), new { id = model.Id }, created);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.ToString(), title: "Create import error");
            }
        }

        private string GenerateImportNumber()
        {
            var today = DateTime.Now;
            var year = today.Year.ToString().Substring(2);
            var month = today.Month.ToString("00");
            var day = today.Day.ToString("00");
            var count = _context.Imports.Count() + 1;
            return $"PN{year}{month}{day}-{count:000000}";
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
                existing.TotalWeight = model.TotalWeight;
                existing.TotalVolume = model.TotalVolume;
                existing.TotalText = model.TotalText;
                existing.ImportType = model.ImportType;
                existing.Supplier = model.Supplier;
                existing.Invoice = model.Invoice;
                existing.InvoiceDate = model.InvoiceDate;

                // Explicitly remove all existing items first and save
                if (existing.Items != null && existing.Items.Any())
                {
                    _context.ImportItems.RemoveRange(existing.Items);
                    await _context.SaveChangesAsync(); // Save deletion first
                }

                // Add new items
                if (model.Items != null && model.Items.Any())
                {
                    foreach (var it in model.Items)
                    {
                        it.Id = 0; // Ensure new item
                        it.ImportId = existing.Id;
                        
                        // Set default values for required string fields
                        if (string.IsNullOrEmpty(it.Barcode)) it.Barcode = "";
                        if (string.IsNullOrEmpty(it.ProductCode)) it.ProductCode = "";
                        if (string.IsNullOrEmpty(it.ProductName)) it.ProductName = "";
                        if (string.IsNullOrEmpty(it.Description)) it.Description = "";
                        if (string.IsNullOrEmpty(it.Specification)) it.Specification = "";
                        if (string.IsNullOrEmpty(it.Unit)) it.Unit = "";
                        if (string.IsNullOrEmpty(it.Warehouse)) it.Warehouse = "";
                        if (string.IsNullOrEmpty(it.Note)) it.Note = "";
                    }
                    await _context.ImportItems.AddRangeAsync(model.Items);
                    await _context.SaveChangesAsync(); // Save addition
                }

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
