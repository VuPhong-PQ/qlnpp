using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyInfosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CompanyInfosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/CompanyInfos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompanyInfo>>> GetCompanyInfos()
        {
            return await _context.CompanyInfos.ToListAsync();
        }

        // GET: api/CompanyInfos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CompanyInfo>> GetCompanyInfo(int id)
        {
            var companyInfo = await _context.CompanyInfos.FindAsync(id);

            if (companyInfo == null)
            {
                return NotFound();
            }

            return companyInfo;
        }

        // POST: api/CompanyInfos
        [HttpPost]
        public async Task<ActionResult<CompanyInfo>> PostCompanyInfo(CompanyInfo companyInfo)
        {
            _context.CompanyInfos.Add(companyInfo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCompanyInfo), new { id = companyInfo.Id }, companyInfo);
        }

        // PUT: api/CompanyInfos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCompanyInfo(int id, CompanyInfo companyInfo)
        {
            if (id != companyInfo.Id)
            {
                return BadRequest();
            }

            _context.Entry(companyInfo).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompanyInfoExists(id))
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

        // DELETE: api/CompanyInfos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompanyInfo(int id)
        {
            var companyInfo = await _context.CompanyInfos.FindAsync(id);
            if (companyInfo == null)
            {
                return NotFound();
            }

            _context.CompanyInfos.Remove(companyInfo);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CompanyInfoExists(int id)
        {
            return _context.CompanyInfos.Any(e => e.Id == id);
        }
    }
}
