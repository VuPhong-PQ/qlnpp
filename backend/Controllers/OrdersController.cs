using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            var orders = await _context.Orders
                .AsNoTracking()
                .ToListAsync();

            return orders;
        }

        // GET: api/Orders/5 (includes items)
        [HttpGet("{id}")]
        public async Task<ActionResult> GetOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);

            if (order == null)
            {
                return NotFound();
            }

            var items = await _context.OrderItems.Where(i => i.OrderId == id).ToListAsync();

            return Ok(new { order, items });
        }

        // POST: api/Orders
        [HttpPost]
        public async Task<ActionResult> PostOrder([FromBody] Order order)
        {
            if (order == null)
                return BadRequest();

            // Save header first
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // If incoming JSON included items under property "items", try to bind and save them
            // This endpoint accepts only Order in body. To create items separately, call api/OrderItems.

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
        }

        // PUT: api/Orders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrder(int id, Order order)
        {
            if (id != order.Id)
                return BadRequest();

            _context.Entry(order).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Orders.Any(e => e.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Orders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound();

            // delete items first
            var items = _context.OrderItems.Where(i => i.OrderId == id);
            _context.OrderItems.RemoveRange(items);

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

