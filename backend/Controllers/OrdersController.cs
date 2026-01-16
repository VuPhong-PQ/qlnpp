using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Controllers
{
    public class CreateOrderRequest
    {
        public Order Order { get; set; } = new Order();
        public List<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }

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
                .OrderByDescending(o => o.OrderDate)
                .ThenByDescending(o => o.Id)
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

        // GET: api/Orders/with-items (get orders with their items)
        [HttpGet("with-items")]
        public async Task<ActionResult> GetOrdersWithItems()
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .AsNoTracking()
                .OrderByDescending(o => o.OrderDate)
                .ThenByDescending(o => o.Id)
                .ToListAsync();

            return Ok(orders);
        }

        // POST: api/Orders
        [HttpPost]
        public async Task<ActionResult> PostOrder([FromBody] Order order)
        {
            if (order == null)
                return BadRequest("Order cannot be null");

            try
            {
                // Set default values if needed
                if (order.OrderDate == default(DateTime))
                    order.OrderDate = DateTime.Today;

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating order: {ex.Message}");
            }
        }

        // POST: api/Orders/create-with-items
        [HttpPost("create-with-items")]
        public async Task<ActionResult> CreateOrderWithItems([FromBody] CreateOrderRequest request)
        {
            if (request == null || request.Order == null)
                return BadRequest("Invalid request");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Set default values if needed
                if (request.Order.OrderDate == default(DateTime))
                    request.Order.OrderDate = DateTime.Today;

                // Calculate totals from items
                if (request.OrderItems?.Any() == true)
                {
                    request.Order.TotalAmount = request.OrderItems.Sum(i => i.Amount);
                    request.Order.TotalAfterDiscount = request.OrderItems.Sum(i => i.TotalAfterDiscount);
                    request.Order.TotalKg = (decimal)request.OrderItems.Sum(i => (double)i.Weight);
                    request.Order.TotalM3 = (decimal)request.OrderItems.Sum(i => (double)i.Volume);
                }

                // Save order first
                _context.Orders.Add(request.Order);
                await _context.SaveChangesAsync();

                // Set OrderId for items and save them
                if (request.OrderItems?.Any() == true)
                {
                    foreach (var item in request.OrderItems)
                    {
                        item.OrderId = request.Order.Id;
                        // Calculate missing fields if needed
                        if (item.Amount == 0)
                            item.Amount = item.Quantity * item.UnitPrice;
                        if (item.Total == 0)
                            item.Total = item.TotalAfterDiscount > 0 ? item.TotalAfterDiscount : item.Amount;
                    }
                    
                    _context.OrderItems.AddRange(request.OrderItems);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // Return the created order with items
                var result = new
                {
                    order = request.Order,
                    items = request.OrderItems
                };

                return CreatedAtAction(nameof(GetOrder), new { id = request.Order.Id }, result);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Error creating order with items: {ex.Message}");
            }
        }

        // PUT: api/Orders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrder(int id, Order order)
        {
            if (id != order.Id)
                return BadRequest("ID mismatch");

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

        // PUT: api/Orders/5/update-with-items
        [HttpPut("{id}/update-with-items")]
        public async Task<IActionResult> UpdateOrderWithItems(int id, [FromBody] CreateOrderRequest request)
        {
            if (request?.Order == null || id != request.Order.Id)
                return BadRequest("Invalid request or ID mismatch");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update order
                var existingOrder = await _context.Orders.FindAsync(id);
                if (existingOrder == null)
                    return NotFound();

                // Copy properties from request to existing order
                _context.Entry(existingOrder).CurrentValues.SetValues(request.Order);

                // Calculate totals from items
                if (request.OrderItems?.Any() == true)
                {
                    existingOrder.TotalAmount = request.OrderItems.Sum(i => i.Amount);
                    existingOrder.TotalAfterDiscount = request.OrderItems.Sum(i => i.TotalAfterDiscount);
                    existingOrder.TotalKg = (decimal)request.OrderItems.Sum(i => (double)i.Weight);
                    existingOrder.TotalM3 = (decimal)request.OrderItems.Sum(i => (double)i.Volume);
                }

                // Delete existing items
                var existingItems = await _context.OrderItems.Where(i => i.OrderId == id).ToListAsync();
                _context.OrderItems.RemoveRange(existingItems);

                // Add new items
                if (request.OrderItems?.Any() == true)
                {
                    foreach (var item in request.OrderItems)
                    {
                        item.Id = 0; // Reset ID for new items
                        item.OrderId = id;
                        // Calculate missing fields if needed
                        if (item.Amount == 0)
                            item.Amount = item.Quantity * item.UnitPrice;
                        if (item.Total == 0)
                            item.Total = item.TotalAfterDiscount > 0 ? item.TotalAfterDiscount : item.Amount;
                    }
                    
                    _context.OrderItems.AddRange(request.OrderItems);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Error updating order with items: {ex.Message}");
            }
        }

        // DELETE: api/Orders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound();

            // Delete items first
            var items = _context.OrderItems.Where(i => i.OrderId == id);
            _context.OrderItems.RemoveRange(items);

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Orders/by-customer/{customerId}
        [HttpGet("by-customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrdersByCustomer(string customerId)
        {
            var orders = await _context.Orders
                .Where(o => o.Customer == customerId)
                .AsNoTracking()
                .OrderByDescending(o => o.OrderDate)
                .ThenByDescending(o => o.Id)
                .ToListAsync();

            return orders;
        }

        // GET: api/Orders/by-date-range
        [HttpGet("by-date-range")]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrdersByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var orders = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
                .AsNoTracking()
                .OrderByDescending(o => o.OrderDate)
                .ThenByDescending(o => o.Id)
                .ToListAsync();

            return orders;
        }
    }
}

