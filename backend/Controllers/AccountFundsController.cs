using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountFundsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AccountFundsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/AccountFunds
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AccountFund>>> GetAccountFunds()
        {
            return await _context.AccountFunds.ToListAsync();
        }

        // GET: api/AccountFunds/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AccountFund>> GetAccountFund(int id)
        {
            var accountFund = await _context.AccountFunds.FindAsync(id);

            if (accountFund == null)
            {
                return NotFound();
            }

            return accountFund;
        }

        // POST: api/AccountFunds
        [HttpPost]
        public async Task<ActionResult<AccountFund>> PostAccountFund(AccountFund accountFund)
        {
            _context.AccountFunds.Add(accountFund);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAccountFund), new { id = accountFund.Id }, accountFund);
        }

        // PUT: api/AccountFunds/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAccountFund(int id, AccountFund accountFund)
        {
            if (id != accountFund.Id)
            {
                return BadRequest();
            }

            _context.Entry(accountFund).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AccountFundExists(id))
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

        // DELETE: api/AccountFunds/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccountFund(int id)
        {
            var accountFund = await _context.AccountFunds.FindAsync(id);
            if (accountFund == null)
            {
                return NotFound();
            }

            _context.AccountFunds.Remove(accountFund);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AccountFundExists(int id)
        {
            return _context.AccountFunds.Any(e => e.Id == id);
        }
    }
}
