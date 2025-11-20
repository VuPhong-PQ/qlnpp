using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerGroupsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomerGroupsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/CustomerGroups
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerGroup>>> GetCustomerGroups()
        {
            return await _context.CustomerGroups.ToListAsync();
        }

        // GET: api/CustomerGroups/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerGroup>> GetCustomerGroup(int id)
        {
            var customerGroup = await _context.CustomerGroups.FindAsync(id);

            if (customerGroup == null)
            {
                return NotFound();
            }

            return customerGroup;
        }

        // POST: api/CustomerGroups
        [HttpPost]
        public async Task<ActionResult<CustomerGroup>> PostCustomerGroup(CustomerGroup customerGroup)
        {
            _context.CustomerGroups.Add(customerGroup);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCustomerGroup), new { id = customerGroup.Id }, customerGroup);
        }

        // PUT: api/CustomerGroups/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCustomerGroup(int id, CustomerGroup customerGroup)
        {
            if (id != customerGroup.Id)
            {
                return BadRequest();
            }

            _context.Entry(customerGroup).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerGroupExists(id))
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

        // DELETE: api/CustomerGroups/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomerGroup(int id)
        {
            var customerGroup = await _context.CustomerGroups.FindAsync(id);
            if (customerGroup == null)
            {
                return NotFound();
            }

            _context.CustomerGroups.Remove(customerGroup);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CustomerGroupExists(int id)
        {
            return _context.CustomerGroups.Any(e => e.Id == id);
        }
    }
}
