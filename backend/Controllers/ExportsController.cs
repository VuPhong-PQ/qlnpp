using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QlnppApi.Data;
using QlnppApi.Models;
using ClosedXML.Excel;
using System.Data;

namespace QlnppApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ExportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Exports
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Export>>> Get()
        {
            var list = await _context.Exports
                .Include(i => i.Items)
                .OrderByDescending(i => i.Date)
                .ThenByDescending(i => i.Id)
                .ToListAsync();
            return Ok(list);
        }

        // GET: api/Exports/template
        [HttpGet("template")]
        public IActionResult GetTemplate([FromQuery] int? sampleFromId = null, [FromQuery] bool exportAll = false, [FromQuery] string ids = null, [FromQuery] string format = "csv")
        {
            var headers = new[] {
                "ExportNumber","Date(DD/MM/YYYY)","Employee","ExportType","Customer","Invoice","InvoiceDate(DD/MM/YYYY)","Total","TotalWeight","TotalVolume",
                "Item.Barcode","Item.ProductCode","Item.ProductName","Item.Description","Item.Unit","Item.Conversion","Item.Quantity","Item.UnitPrice","Item.TransportCost","Item.NoteDate(DD/MM/YYYY)","Item.Total","Item.TotalTransport","Item.Weight","Item.Volume","Item.Warehouse","Item.Note"
            };

            var rows = new List<List<string>>();
            rows.Add(headers.ToList());

            if (!string.IsNullOrEmpty(ids))
            {
                var idList = ids.Split(',').Select(s => { int v; return int.TryParse(s.Trim(), out v) ? v : 0; }).Where(v => v > 0).ToList();
                var selExports = _context.Exports.Include(i => i.Items).Where(i => idList.Contains(i.Id)).OrderBy(i => i.Id).ToList();
                foreach (var expAll in selExports)
                {
                    if (expAll.Items != null && expAll.Items.Any())
                    {
                        foreach (var it in expAll.Items)
                        {
                            var row = new List<string>();
                            row.Add(EscapeCsv(expAll.ExportNumber));
                            row.Add(expAll.Date.ToString("dd/MM/yyyy"));
                            row.Add(EscapeCsv(expAll.Employee));
                            row.Add(EscapeCsv(expAll.ExportType));
                            row.Add(EscapeCsv(expAll.Customer));
                            row.Add(EscapeCsv(expAll.Invoice));
                            row.Add(expAll.InvoiceDate.ToString("dd/MM/yyyy"));
                            row.Add(expAll.Total.ToString());
                            row.Add(expAll.TotalWeight.ToString());
                            row.Add(expAll.TotalVolume.ToString());

                            row.Add(EscapeCsv(it.Barcode));
                            row.Add(EscapeCsv(it.ProductCode));
                            row.Add(EscapeCsv(it.ProductName));
                            row.Add(EscapeCsv(it.Description));
                            row.Add(EscapeCsv(it.Unit));
                            row.Add(it.Conversion?.ToString() ?? string.Empty);
                            row.Add(it.Quantity?.ToString() ?? string.Empty);
                            row.Add(it.UnitPrice?.ToString() ?? string.Empty);
                            row.Add(it.TransportCost?.ToString() ?? string.Empty);
                            row.Add(it.NoteDate?.ToString("dd/MM/yyyy") ?? string.Empty);
                            row.Add(it.Total?.ToString() ?? string.Empty);
                            row.Add(it.TotalTransport?.ToString() ?? string.Empty);
                            row.Add(it.Weight?.ToString() ?? string.Empty);
                            row.Add(it.Volume?.ToString() ?? string.Empty);
                            row.Add(EscapeCsv(it.Warehouse));
                            row.Add(EscapeCsv(it.Note));

                            rows.Add(row);
                        }
                    }
                    else
                    {
                        var row = new List<string>();
                        row.Add(EscapeCsv(expAll.ExportNumber));
                        row.Add(expAll.Date.ToString("dd/MM/yyyy"));
                        row.Add(EscapeCsv(expAll.Employee));
                        row.Add(EscapeCsv(expAll.ExportType));
                        row.Add(EscapeCsv(expAll.Customer));
                        row.Add(EscapeCsv(expAll.Invoice));
                        row.Add(expAll.InvoiceDate.ToString("dd/MM/yyyy"));
                        row.Add(expAll.Total.ToString());
                        row.Add(expAll.TotalWeight.ToString());
                        row.Add(expAll.TotalVolume.ToString());

                        var full = row.Concat(Enumerable.Repeat(string.Empty, headers.Length - row.Count)).ToList();
                        rows.Add(full);
                    }
                }
            }
            else if (exportAll)
            {
                var allExports = _context.Exports.Include(i => i.Items).OrderBy(i => i.Id).ToList();
                foreach (var expAll in allExports)
                {
                    if (expAll.Items != null && expAll.Items.Any())
                    {
                        foreach (var it in expAll.Items)
                        {
                            var row = new List<string>();
                            row.Add(EscapeCsv(expAll.ExportNumber));
                            row.Add(expAll.Date.ToString("dd/MM/yyyy"));
                            row.Add(EscapeCsv(expAll.Employee));
                            row.Add(EscapeCsv(expAll.ExportType));
                            row.Add(EscapeCsv(expAll.Customer));
                            row.Add(EscapeCsv(expAll.Invoice));
                            row.Add(expAll.InvoiceDate.ToString("dd/MM/yyyy"));
                            row.Add(expAll.Total.ToString());
                            row.Add(expAll.TotalWeight.ToString());
                            row.Add(expAll.TotalVolume.ToString());

                            row.Add(EscapeCsv(it.Barcode));
                            row.Add(EscapeCsv(it.ProductCode));
                            row.Add(EscapeCsv(it.ProductName));
                            row.Add(EscapeCsv(it.Description));
                            row.Add(EscapeCsv(it.Unit));
                            row.Add(it.Conversion?.ToString() ?? string.Empty);
                            row.Add(it.Quantity?.ToString() ?? string.Empty);
                            row.Add(it.UnitPrice?.ToString() ?? string.Empty);
                            row.Add(it.TransportCost?.ToString() ?? string.Empty);
                            row.Add(it.NoteDate?.ToString("dd/MM/yyyy") ?? string.Empty);
                            row.Add(it.Total?.ToString() ?? string.Empty);
                            row.Add(it.TotalTransport?.ToString() ?? string.Empty);
                            row.Add(it.Weight?.ToString() ?? string.Empty);
                            row.Add(it.Volume?.ToString() ?? string.Empty);
                            row.Add(EscapeCsv(it.Warehouse));
                            row.Add(EscapeCsv(it.Note));

                            rows.Add(row);
                        }
                    }
                    else
                    {
                        var row = new List<string>();
                        row.Add(EscapeCsv(expAll.ExportNumber));
                        row.Add(expAll.Date.ToString("dd/MM/yyyy"));
                        row.Add(EscapeCsv(expAll.Employee));
                        row.Add(EscapeCsv(expAll.ExportType));
                        row.Add(EscapeCsv(expAll.Customer));
                        row.Add(EscapeCsv(expAll.Invoice));
                        row.Add(expAll.InvoiceDate.ToString("dd/MM/yyyy"));
                        row.Add(expAll.Total.ToString());
                        row.Add(expAll.TotalWeight.ToString());
                        row.Add(expAll.TotalVolume.ToString());

                        var full = row.Concat(Enumerable.Repeat(string.Empty, headers.Length - row.Count)).ToList();
                        rows.Add(full);
                    }
                }
            }
            else if (sampleFromId.HasValue)
            {
                var exp = _context.Exports.Include(i => i.Items).FirstOrDefault(i => i.Id == sampleFromId.Value);
                if (exp != null)
                {
                    foreach (var it in exp.Items)
                    {
                        var row = new List<string>();
                        row.Add(EscapeCsv(exp.ExportNumber));
                        row.Add(exp.Date.ToString("dd/MM/yyyy"));
                        row.Add(EscapeCsv(exp.Employee));
                        row.Add(EscapeCsv(exp.ExportType));
                        row.Add(EscapeCsv(exp.Customer));
                        row.Add(EscapeCsv(exp.Invoice));
                        row.Add(exp.InvoiceDate.ToString("dd/MM/yyyy"));
                        row.Add(exp.Total.ToString());
                        row.Add(exp.TotalWeight.ToString());
                        row.Add(exp.TotalVolume.ToString());

                        row.Add(EscapeCsv(it.Barcode));
                        row.Add(EscapeCsv(it.ProductCode));
                        row.Add(EscapeCsv(it.ProductName));
                        row.Add(EscapeCsv(it.Description));
                        row.Add(EscapeCsv(it.Unit));
                        row.Add(it.Conversion?.ToString() ?? string.Empty);
                        row.Add(it.Quantity?.ToString() ?? string.Empty);
                        row.Add(it.UnitPrice?.ToString() ?? string.Empty);
                        row.Add(it.TransportCost?.ToString() ?? string.Empty);
                        row.Add(it.NoteDate?.ToString("dd/MM/yyyy") ?? string.Empty);
                        row.Add(it.Total?.ToString() ?? string.Empty);
                        row.Add(it.TotalTransport?.ToString() ?? string.Empty);
                        row.Add(it.Weight?.ToString() ?? string.Empty);
                        row.Add(it.Volume?.ToString() ?? string.Empty);
                        row.Add(EscapeCsv(it.Warehouse));
                        row.Add(EscapeCsv(it.Note));

                        rows.Add(row);
                    }
                }
                else
                {
                    rows.Add(Enumerable.Repeat(string.Empty, headers.Length).ToList());
                }
            }
            else
            {
                rows.Add(Enumerable.Repeat(string.Empty, headers.Length).ToList());
            }

            if (!string.IsNullOrEmpty(format) && format.ToLower() == "xlsx")
            {
                using var wb = new XLWorkbook();
                var ws = wb.Worksheets.Add("Exports");
                for (int r = 0; r < rows.Count; r++)
                {
                    var row = rows[r];
                    for (int c = 0; c < row.Count; c++)
                    {
                        ws.Cell(r + 1, c + 1).Value = row[c] ?? string.Empty;
                    }
                }
                ws.Style.Font.FontName = "Times New Roman";
                ws.Columns().AdjustToContents();

                using var ms = new System.IO.MemoryStream();
                wb.SaveAs(ms);
                ms.Position = 0;
                var fileNameX = exportAll ? "export_all_template.xlsx" : (sampleFromId.HasValue ? $"export_template_{sampleFromId.Value}.xlsx" : "export_template.xlsx");
                return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileNameX);
            }

            var csv = string.Join('\n', rows.Select(r => string.Join(',', r.Select(EscapeCsv)))) + '\n';
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            var fileName = exportAll ? "export_all_template.csv" : (sampleFromId.HasValue ? $"export_template_{sampleFromId.Value}.csv" : "export_template.csv");
            return File(bytes, "text/csv", fileName);
        }

        private static string EscapeCsv(string s)
        {
            if (s == null) return string.Empty;
            if (s.Contains(',') || s.Contains('"') || s.Contains('\n') || s.Contains('\r'))
            {
                return '"' + s.Replace("\"", "\"\"") + '"';
            }
            return s;
        }

        // POST: api/Exports/import-template
        [HttpPost("import-template")]
        public async Task<IActionResult> ImportFromTemplate([FromQuery] bool forceOverwrite = false)
        {
            try
            {
                var files = Request.Form?.Files;
                if (files == null || files.Count == 0) return BadRequest("No file uploaded");
                var file = files[0];
                
                var fileName = file.FileName?.ToLower() ?? "";
                var isExcel = fileName.EndsWith(".xlsx") || fileName.EndsWith(".xls");
                
                string[] header;
                List<string[]> dataRows = new List<string[]>();
                
                if (isExcel)
                {
                    using var stream = file.OpenReadStream();
                    using var workbook = new XLWorkbook(stream);
                    var worksheet = workbook.Worksheet(1);
                    var rowsUsed = worksheet.RowsUsed();
                    
                    if (!rowsUsed.Any()) return BadRequest("Empty Excel file");
                    
                    var headerRow = rowsUsed.First();
                    header = headerRow.Cells().Select(c => c.GetValue<string>()?.Trim() ?? "").ToArray();
                    
                    foreach (var row in rowsUsed.Skip(1))
                    {
                        var cells = row.Cells(1, header.Length).Select(c => c.GetValue<string>()?.Trim() ?? "").ToArray();
                        dataRows.Add(cells);
                    }
                }
                else
                {
                    using var stream = file.OpenReadStream();
                    using var reader = new StreamReader(stream);
                    var content = await reader.ReadToEndAsync();
                    var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    if (lines.Length < 2) return BadRequest("Empty CSV");

                    header = lines[0].Split(',').Select(h => h.Trim().Trim('"')).ToArray();
                    
                    for (int i = 1; i < lines.Length; i++)
                    {
                        var cols = lines[i].Split(',').Select(c => c.Trim().Trim('"')).ToArray();
                        dataRows.Add(cols);
                    }
                }

                Export singleExport = null;
                string sharedExportNumber = null;

                if (dataRows.Any())
                {
                    var firstRow = dataRows.First();
                    var expNumber = firstRow.ElementAtOrDefault(Array.IndexOf(header, "ExportNumber")) ?? string.Empty;
                    
                    if (string.IsNullOrWhiteSpace(expNumber))
                    {
                        sharedExportNumber = GenerateExportNumber();
                    }
                    else
                    {
                        sharedExportNumber = expNumber;
                    }

                    var existingExport = await _context.Exports.Include(i => i.Items).FirstOrDefaultAsync(i => i.ExportNumber == sharedExportNumber);
                    if (existingExport != null)
                    {
                        if (forceOverwrite)
                        {
                            return BadRequest("Phiếu này đã bị trùng trong hệ thống");
                        }
                        else
                        {
                            return Ok(new { isDuplicate = true, existingExportNumber = sharedExportNumber });
                        }
                    }

                    singleExport = new Export
                    {
                        ExportNumber = sharedExportNumber,
                        Date = DateTime.Now,
                        Employee = "admin 66",
                        ExportType = string.Empty,
                        Customer = string.Empty,
                        Invoice = string.Empty,
                        Note = string.Empty,
                        InvoiceDate = DateTime.Now
                    };
                }

                foreach (var cols in dataRows)
                {
                    if (cols.Length == 0 || singleExport == null) continue;

                    // Update export header fields from first row
                    if (singleExport.Items.Count == 0)
                    {
                        var dateIdx = Array.IndexOf(header, "Date(DD/MM/YYYY)");
                        if (dateIdx >= 0 && dateIdx < cols.Length && !string.IsNullOrEmpty(cols[dateIdx]))
                        {
                            if (DateTime.TryParseExact(cols[dateIdx], "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var d))
                                singleExport.Date = d;
                        }
                        var empIdx = Array.IndexOf(header, "Employee");
                        if (empIdx >= 0 && empIdx < cols.Length) singleExport.Employee = cols[empIdx];
                        var typeIdx = Array.IndexOf(header, "ExportType");
                        if (typeIdx >= 0 && typeIdx < cols.Length) singleExport.ExportType = cols[typeIdx];
                        var custIdx = Array.IndexOf(header, "Customer");
                        if (custIdx >= 0 && custIdx < cols.Length) singleExport.Customer = cols[custIdx];
                        var invIdx = Array.IndexOf(header, "Invoice");
                        if (invIdx >= 0 && invIdx < cols.Length) singleExport.Invoice = cols[invIdx];
                        var invDateIdx = Array.IndexOf(header, "InvoiceDate(DD/MM/YYYY)");
                        if (invDateIdx >= 0 && invDateIdx < cols.Length && !string.IsNullOrEmpty(cols[invDateIdx]))
                        {
                            if (DateTime.TryParseExact(cols[invDateIdx], "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var id))
                                singleExport.InvoiceDate = id;
                        }
                    }

                    // Parse item
                    var item = new ExportItem();
                    var barcodeIdx = Array.IndexOf(header, "Item.Barcode");
                    if (barcodeIdx >= 0 && barcodeIdx < cols.Length) item.Barcode = cols[barcodeIdx];
                    var codeIdx = Array.IndexOf(header, "Item.ProductCode");
                    if (codeIdx >= 0 && codeIdx < cols.Length) item.ProductCode = cols[codeIdx];
                    var nameIdx = Array.IndexOf(header, "Item.ProductName");
                    if (nameIdx >= 0 && nameIdx < cols.Length) item.ProductName = cols[nameIdx];
                    var descIdx = Array.IndexOf(header, "Item.Description");
                    if (descIdx >= 0 && descIdx < cols.Length) item.Description = cols[descIdx];
                    var unitIdx = Array.IndexOf(header, "Item.Unit");
                    if (unitIdx >= 0 && unitIdx < cols.Length) item.Unit = cols[unitIdx];
                    var convIdx = Array.IndexOf(header, "Item.Conversion");
                    if (convIdx >= 0 && convIdx < cols.Length && decimal.TryParse(cols[convIdx], out var conv)) item.Conversion = conv;
                    var qtyIdx = Array.IndexOf(header, "Item.Quantity");
                    if (qtyIdx >= 0 && qtyIdx < cols.Length && decimal.TryParse(cols[qtyIdx], out var qty)) item.Quantity = qty;
                    var priceIdx = Array.IndexOf(header, "Item.UnitPrice");
                    if (priceIdx >= 0 && priceIdx < cols.Length && decimal.TryParse(cols[priceIdx], out var price)) item.UnitPrice = price;
                    var tcIdx = Array.IndexOf(header, "Item.TransportCost");
                    if (tcIdx >= 0 && tcIdx < cols.Length && decimal.TryParse(cols[tcIdx], out var tc)) item.TransportCost = tc;
                    var noteDateIdx = Array.IndexOf(header, "Item.NoteDate(DD/MM/YYYY)");
                    if (noteDateIdx >= 0 && noteDateIdx < cols.Length && !string.IsNullOrEmpty(cols[noteDateIdx]))
                    {
                        if (DateTime.TryParseExact(cols[noteDateIdx], "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var nd))
                            item.NoteDate = nd;
                    }
                    var totalIdx = Array.IndexOf(header, "Item.Total");
                    if (totalIdx >= 0 && totalIdx < cols.Length && decimal.TryParse(cols[totalIdx], out var tot)) item.Total = tot;
                    var ttIdx = Array.IndexOf(header, "Item.TotalTransport");
                    if (ttIdx >= 0 && ttIdx < cols.Length && decimal.TryParse(cols[ttIdx], out var tt)) item.TotalTransport = tt;
                    var wIdx = Array.IndexOf(header, "Item.Weight");
                    if (wIdx >= 0 && wIdx < cols.Length && decimal.TryParse(cols[wIdx], out var w)) item.Weight = w;
                    var vIdx = Array.IndexOf(header, "Item.Volume");
                    if (vIdx >= 0 && vIdx < cols.Length && decimal.TryParse(cols[vIdx], out var v)) item.Volume = v;
                    var whIdx = Array.IndexOf(header, "Item.Warehouse");
                    if (whIdx >= 0 && whIdx < cols.Length) item.Warehouse = cols[whIdx];
                    var noteIdx = Array.IndexOf(header, "Item.Note");
                    if (noteIdx >= 0 && noteIdx < cols.Length) item.Note = cols[noteIdx];

                    if (!string.IsNullOrEmpty(item.ProductCode) || !string.IsNullOrEmpty(item.Barcode) || !string.IsNullOrEmpty(item.ProductName))
                    {
                        singleExport.Items.Add(item);
                    }
                }

                if (singleExport != null)
                {
                    // Validate product codes exist in Products table (mã hàng)
                    var codes = singleExport.Items
                        .Select(i => i.ProductCode?.Trim())
                        .Where(s => !string.IsNullOrEmpty(s))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    if (codes.Any())
                    {
                        var existingCodes = await _context.Products
                            .Where(p => codes.Contains(p.Code))
                            .Select(p => p.Code)
                            .ToListAsync();

                        var missing = codes.Except(existingCodes, StringComparer.OrdinalIgnoreCase).ToList();
                        if (missing.Any())
                        {
                            var missingDetails = missing.Select(code =>
                            {
                                var item = singleExport.Items.FirstOrDefault(it => string.Equals(it.ProductCode, code, StringComparison.OrdinalIgnoreCase));
                                var name = item?.ProductName ?? string.Empty;
                                return string.IsNullOrEmpty(name) ? code : $"{code}: {name}";
                            }).ToList();

                            var msg = $"Phiếu nhập thêm vào có sản phẩm chưa tồn tại trong hệ thống: {string.Join(", ", missingDetails)}. Vui lòng thêm sản phẩm trước";
                            return BadRequest(msg);
                        }
                    }

                    singleExport.Total = singleExport.Items.Sum(i => i.Total ?? 0);
                    singleExport.TotalWeight = singleExport.Items.Sum(i => i.Weight ?? 0);
                    singleExport.TotalVolume = singleExport.Items.Sum(i => i.Volume ?? 0);
                    _context.Exports.Add(singleExport);
                    await _context.SaveChangesAsync();
                    return Ok(singleExport);
                }

                return BadRequest("No valid data to import");
            }
            catch (Exception ex)
            {
                return BadRequest($"Import failed: {ex.Message}");
            }
        }

        private static string GenerateExportNumber()
        {
            var today = DateTime.Now;
            var day = today.Day.ToString("00");
            var month = today.Month.ToString("00");
            var year = today.Year;
            var timestamp = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString();
            var uniqueId = timestamp.Substring(timestamp.Length - 4);
            return $"PX-{day}{month}{year}-{uniqueId}";
        }

        // GET: api/Exports/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Export>> Get(int id)
        {
            var exp = await _context.Exports.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
            if (exp == null) return NotFound();
            return Ok(exp);
        }

        // POST: api/Exports
        [HttpPost]
        public async Task<ActionResult<Export>> Post([FromBody] Export export)
        {
            if (export == null) return BadRequest();
            
            if (string.IsNullOrEmpty(export.ExportNumber))
            {
                export.ExportNumber = GenerateExportNumber();
            }

            foreach (var item in export.Items)
            {
                item.ExportId = 0;
                item.Export = null;
            }

            _context.Exports.Add(export);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = export.Id }, export);
        }

        // PUT: api/Exports/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Export export)
        {
            if (id != export.Id) return BadRequest();

            var existing = await _context.Exports.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
            if (existing == null) return NotFound();

            existing.ExportNumber = export.ExportNumber;
            existing.Date = export.Date;
            existing.Note = export.Note;
            existing.Employee = export.Employee;
            existing.ExportType = export.ExportType;
            existing.Customer = export.Customer;
            existing.Invoice = export.Invoice;
            existing.InvoiceDate = export.InvoiceDate;
            existing.Total = export.Total;
            existing.TotalWeight = export.TotalWeight;
            existing.TotalVolume = export.TotalVolume;
            existing.TotalText = export.TotalText;

            _context.ExportItems.RemoveRange(existing.Items);

            foreach (var item in export.Items)
            {
                item.Id = 0;
                item.ExportId = id;
                item.Export = null;
                existing.Items.Add(item);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Exports/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var exp = await _context.Exports.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
            if (exp == null) return NotFound();

            _context.ExportItems.RemoveRange(exp.Items);
            _context.Exports.Remove(exp);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
