using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BankLoansController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BankLoansController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/BankLoans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BankLoan>>> GetBankLoans()
        {
            return await _context.BankLoans.ToListAsync();
        }

        // GET: api/BankLoans/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BankLoan>> GetBankLoan(int id)
        {
            var bankLoan = await _context.BankLoans.FindAsync(id);

            if (bankLoan == null)
            {
                return NotFound();
            }

            return bankLoan;
        }

        // POST: api/BankLoans
        [HttpPost]
        public async Task<ActionResult<BankLoan>> PostBankLoan(BankLoan bankLoan)
        {
            _context.BankLoans.Add(bankLoan);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBankLoan), new { id = bankLoan.Id }, bankLoan);
        }

        // PUT: api/BankLoans/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBankLoan(int id, BankLoan bankLoan)
        {
            if (id != bankLoan.Id)
            {
                return BadRequest();
            }

            _context.Entry(bankLoan).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BankLoanExists(id))
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

        // DELETE: api/BankLoans/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBankLoan(int id)
        {
            var bankLoan = await _context.BankLoans.FindAsync(id);
            if (bankLoan == null)
            {
                return NotFound();
            }

            _context.BankLoans.Remove(bankLoan);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BankLoanExists(int id)
        {
            return _context.BankLoans.Any(e => e.Id == id);
        }
    }
}
