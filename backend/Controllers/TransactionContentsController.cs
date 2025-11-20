using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionContentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TransactionContentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/TransactionContents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TransactionContent>>> GetTransactionContents()
        {
            return await _context.TransactionContents.ToListAsync();
        }

        // GET: api/TransactionContents/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TransactionContent>> GetTransactionContent(int id)
        {
            var transactionContent = await _context.TransactionContents.FindAsync(id);

            if (transactionContent == null)
            {
                return NotFound();
            }

            return transactionContent;
        }

        // POST: api/TransactionContents
        [HttpPost]
        public async Task<ActionResult<TransactionContent>> PostTransactionContent(TransactionContent transactionContent)
        {
            _context.TransactionContents.Add(transactionContent);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTransactionContent), new { id = transactionContent.Id }, transactionContent);
        }

        // PUT: api/TransactionContents/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTransactionContent(int id, TransactionContent transactionContent)
        {
            if (id != transactionContent.Id)
            {
                return BadRequest();
            }

            _context.Entry(transactionContent).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TransactionContentExists(id))
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

        // DELETE: api/TransactionContents/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransactionContent(int id)
        {
            var transactionContent = await _context.TransactionContents.FindAsync(id);
            if (transactionContent == null)
            {
                return NotFound();
            }

            _context.TransactionContents.Remove(transactionContent);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TransactionContentExists(int id)
        {
            return _context.TransactionContents.Any(e => e.Id == id);
        }
    }
}
