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
            // Include Items to support lastcopy feature (finding most recent price/transport cost for products)
            var list = await _context.Imports
                .Include(i => i.Items)
                .OrderByDescending(i => i.Date)
                .ThenByDescending(i => i.Id)
                .ToListAsync();
            return Ok(list);
        }

        // GET: api/Imports/template
        // Returns a CSV template for imports that users can fill and re-import
        [HttpGet("template")]
        public IActionResult GetTemplate([FromQuery] int? sampleFromId = null, [FromQuery] bool exportAll = false, [FromQuery] string ids = null, [FromQuery] string format = "csv")
        {
            var headers = new[] {
                "ImportNumber","Date(DD/MM/YYYY)","Employee","ImportType","Supplier","Invoice","InvoiceDate(DD/MM/YYYY)","Total","TotalWeight","TotalVolume",
                "Item.Barcode","Item.ProductCode","Item.ProductName","Item.Description","Item.Unit","Item.Conversion","Item.Quantity","Item.UnitPrice","Item.TransportCost","Item.NoteDate(DD/MM/YYYY)","Item.Total","Item.TotalTransport","Item.Weight","Item.Volume","Item.Warehouse","Item.Note"
            };

            var rows = new List<List<string>>();
            rows.Add(headers.ToList());

            if (!string.IsNullOrEmpty(ids))
            {
                // Export only specified imports (ids comma separated)
                var idList = ids.Split(',').Select(s => { int v; return int.TryParse(s.Trim(), out v) ? v : 0; }).Where(v => v > 0).ToList();
                var selImports = _context.Imports.Include(i => i.Items).Where(i => idList.Contains(i.Id)).OrderBy(i => i.Id).ToList();
                foreach (var impAll in selImports)
                {
                    if (impAll.Items != null && impAll.Items.Any())
                    {
                        foreach (var it in impAll.Items)
                        {
                            var row = new List<string>();
                            row.Add(EscapeCsv(impAll.ImportNumber));
                            row.Add(impAll.Date.ToString("dd/MM/yyyy"));
                            row.Add(EscapeCsv(impAll.Employee));
                            row.Add(EscapeCsv(impAll.ImportType));
                            row.Add(EscapeCsv(impAll.Supplier));
                            row.Add(EscapeCsv(impAll.Invoice));
                            row.Add(impAll.InvoiceDate.ToString("dd/MM/yyyy"));
                            row.Add(impAll.Total.ToString());
                            row.Add(impAll.TotalWeight.ToString());
                            row.Add(impAll.TotalVolume.ToString());

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
                        row.Add(EscapeCsv(impAll.ImportNumber));
                        row.Add(impAll.Date.ToString("dd/MM/yyyy"));
                        row.Add(EscapeCsv(impAll.Employee));
                        row.Add(EscapeCsv(impAll.ImportType));
                        row.Add(EscapeCsv(impAll.Supplier));
                        row.Add(EscapeCsv(impAll.Invoice));
                        row.Add(impAll.InvoiceDate.ToString("dd/MM/yyyy"));
                        row.Add(impAll.Total.ToString());
                        row.Add(impAll.TotalWeight.ToString());
                        row.Add(impAll.TotalVolume.ToString());

                        var full = row.Concat(Enumerable.Repeat(string.Empty, headers.Length - row.Count)).ToList();
                        rows.Add(full);
                    }
                }
            }
            else if (exportAll)
            {
                // Export all imports and their items
                var allImports = _context.Imports.Include(i => i.Items).OrderBy(i => i.Id).ToList();
                foreach (var impAll in allImports)
                {
                    if (impAll.Items != null && impAll.Items.Any())
                    {
                        foreach (var it in impAll.Items)
                        {
                            var row = new List<string>();
                            row.Add(EscapeCsv(impAll.ImportNumber));
                            row.Add(impAll.Date.ToString("dd/MM/yyyy"));
                            row.Add(EscapeCsv(impAll.Employee));
                            row.Add(EscapeCsv(impAll.ImportType));
                            row.Add(EscapeCsv(impAll.Supplier));
                            row.Add(EscapeCsv(impAll.Invoice));
                            row.Add(impAll.InvoiceDate.ToString("dd/MM/yyyy"));
                            row.Add(impAll.Total.ToString());
                            row.Add(impAll.TotalWeight.ToString());
                            row.Add(impAll.TotalVolume.ToString());

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
                        // Import without items: produce a single row with blank item fields
                        var row = new List<string>();
                        row.Add(EscapeCsv(impAll.ImportNumber));
                        row.Add(impAll.Date.ToString("dd/MM/yyyy"));
                        row.Add(EscapeCsv(impAll.Employee));
                        row.Add(EscapeCsv(impAll.ImportType));
                        row.Add(EscapeCsv(impAll.Supplier));
                        row.Add(EscapeCsv(impAll.Invoice));
                        row.Add(impAll.InvoiceDate.ToString("dd/MM/yyyy"));
                        row.Add(impAll.Total.ToString());
                        row.Add(impAll.TotalWeight.ToString());
                        row.Add(impAll.TotalVolume.ToString());

                        // Add empty item columns
                        var full = row.Concat(Enumerable.Repeat(string.Empty, headers.Length - row.Count)).ToList();
                        rows.Add(full);
                    }
                }
            }
            else if (sampleFromId.HasValue)
            {
                // Try to find the import and add its items as sample rows
                var imp = _context.Imports.Include(i => i.Items).FirstOrDefault(i => i.Id == sampleFromId.Value);
                if (imp != null)
                {
                    foreach (var it in imp.Items)
                    {
                        var row = new List<string>();
                        row.Add(EscapeCsv(imp.ImportNumber));
                        row.Add(imp.Date.ToString("dd/MM/yyyy"));
                        row.Add(EscapeCsv(imp.Employee));
                        row.Add(EscapeCsv(imp.ImportType));
                        row.Add(EscapeCsv(imp.Supplier));
                        row.Add(EscapeCsv(imp.Invoice));
                        row.Add(imp.InvoiceDate.ToString("dd/MM/yyyy"));
                        row.Add(imp.Total.ToString());
                        row.Add(imp.TotalWeight.ToString());
                        row.Add(imp.TotalVolume.ToString());

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
                    // fallback to blank row if import not found
                    rows.Add(Enumerable.Repeat(string.Empty, headers.Length).ToList());
                }
            }
            else
            {
                // default: single blank row
                rows.Add(Enumerable.Repeat(string.Empty, headers.Length).ToList());
            }
            // If requested XLSX, generate Excel file with Times New Roman font
            if (!string.IsNullOrEmpty(format) && format.ToLower() == "xlsx")
            {
                using var wb = new XLWorkbook();
                var ws = wb.Worksheets.Add("Imports");
                // Write rows
                for (int r = 0; r < rows.Count; r++)
                {
                    var row = rows[r];
                    for (int c = 0; c < row.Count; c++)
                    {
                        ws.Cell(r + 1, c + 1).Value = row[c] ?? string.Empty;
                    }
                }
                // Set font for whole sheet
                ws.Style.Font.FontName = "Times New Roman";
                ws.Columns().AdjustToContents();

                using var ms = new System.IO.MemoryStream();
                wb.SaveAs(ms);
                ms.Position = 0;
                var fileNameX = exportAll ? "import_all_template.xlsx" : (sampleFromId.HasValue ? $"import_template_{sampleFromId.Value}.xlsx" : "import_template.xlsx");
                return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileNameX);
            }

            var csv = string.Join('\n', rows.Select(r => string.Join(',', r.Select(EscapeCsv)))) + '\n';
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            var fileName = exportAll ? "import_all_template.csv" : (sampleFromId.HasValue ? $"import_template_{sampleFromId.Value}.csv" : "import_template.csv");
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

        // POST: api/Imports/import-template
        // Accepts a CSV or Excel file (form-data key 'file') and imports rows into DB.
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
                    // Handle Excel file
                    using var stream = file.OpenReadStream();
                    using var workbook = new XLWorkbook(stream);
                    var worksheet = workbook.Worksheet(1); // First sheet
                    var rows = worksheet.RowsUsed();
                    
                    if (!rows.Any()) return BadRequest("Empty Excel file");
                    
                    // Get header row (first row)
                    var headerRow = rows.First();
                    header = headerRow.Cells().Select(c => c.GetValue<string>()?.Trim() ?? "").ToArray();
                    
                    // Get data rows (skip header)
                    foreach (var row in rows.Skip(1))
                    {
                        var cells = row.Cells(1, header.Length).Select(c => c.GetValue<string>()?.Trim() ?? "").ToArray();
                        dataRows.Add(cells);
                    }
                }
                else
                {
                    // Handle CSV file
                    using var stream = file.OpenReadStream();
                    using var reader = new StreamReader(stream);
                    var content = await reader.ReadToEndAsync();
                    var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    if (lines.Length < 2) return BadRequest("Empty CSV");

                    header = lines[0].Split(',').Select(h => h.Trim().Trim('"')).ToArray();
                    
                    // Parse CSV data rows
                    for (int i = 1; i < lines.Length; i++)
                    {
                        var cols = lines[i].Split(',').Select(c => c.Trim().Trim('"')).ToArray();
                        dataRows.Add(cols);
                    }
                }

                // Expecting the data to be per-item row with import-level fields repeated.
                Import singleImport = null;
                string sharedImportNumber = null;
                bool isOverwriting = false;

                // First, determine the import number from the first row
                if (dataRows.Any())
                {
                    var firstRow = dataRows.First();
                    var impNumber = firstRow.ElementAtOrDefault(Array.IndexOf(header, "ImportNumber")) ?? string.Empty;
                    
                    if (string.IsNullOrWhiteSpace(impNumber))
                    {
                        sharedImportNumber = GenerateImportNumber();
                    }
                    else
                    {
                        sharedImportNumber = impNumber;
                    }

                    // Check if import number already exists in database
                    var existingImport = await _context.Imports.Include(i => i.Items).FirstOrDefaultAsync(i => i.ImportNumber == sharedImportNumber);
                    if (existingImport != null)
                    {
                        if (forceOverwrite)
                        {
                            return BadRequest("Phiếu này đã bị trùng trong hệ thống");
                        }
                        else
                        {
                            return Ok(new { isDuplicate = true, existingImportNumber = sharedImportNumber });
                        }
                    }

                    // Create new import (no overwriting allowed)
                    singleImport = new Import
                    {
                        ImportNumber = sharedImportNumber,
                        Date = DateTime.Now,
                        Employee = "admin 66",
                        ImportType = string.Empty,
                        Supplier = string.Empty,
                        Invoice = string.Empty,
                        Note = string.Empty,
                        InvoiceDate = DateTime.Now
                    };
                }

                foreach (var cols in dataRows)
                {
                    if (cols.Length == 0 || singleImport == null) continue; // Skip empty rows

                    // BEFORE processing items: validate that referenced products exist
                    // (do this once before main loop)
                    // Build sets of codes/barcodes from dataRows
                    // NOTE: this check runs only once (on first iteration)
                    if (singleImport != null && singleImport.Items.Count == 0)
                    {
                        var productCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                        var barcodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                        var idxCode = Array.IndexOf(header, "Item.ProductCode");
                        var idxBarcode = Array.IndexOf(header, "Item.Barcode");
                        foreach (var r in dataRows)
                        {
                            if (idxCode >= 0 && idxCode < r.Length)
                            {
                                var c = (r[idxCode] ?? string.Empty).Trim();
                                if (!string.IsNullOrEmpty(c)) productCodes.Add(c);
                            }
                            if (idxBarcode >= 0 && idxBarcode < r.Length)
                            {
                                var b = (r[idxBarcode] ?? string.Empty).Trim();
                                if (!string.IsNullOrEmpty(b)) barcodes.Add(b);
                            }
                        }

                        if (productCodes.Count > 0 || barcodes.Count > 0)
                        {
                            var existingProducts = await _context.Products
                                .Where(p => productCodes.Contains(p.Code) || barcodes.Contains(p.Barcode))
                                .Select(p => new { p.Code, p.Barcode })
                                .ToListAsync();

                            var existingCodes = new HashSet<string>(existingProducts.Select(p => p.Code), StringComparer.OrdinalIgnoreCase);
                            var existingBarcodes = new HashSet<string>(existingProducts.Select(p => p.Barcode), StringComparer.OrdinalIgnoreCase);

                            var missingCode = productCodes.FirstOrDefault(pc => !existingCodes.Contains(pc));
                            if (missingCode != null)
                            {
                                return BadRequest($"Sản phẩm có mã hàng {missingCode} không có trong danh mục sản phẩm, vui lòng thêm sản phẩm trước");
                            }
                            var missingBarcode = barcodes.FirstOrDefault(bc => !existingBarcodes.Contains(bc));
                            if (missingBarcode != null)
                            {
                                return BadRequest($"Sản phẩm có mã hàng {missingBarcode} không có trong danh mục sản phẩm, vui lòng thêm sản phẩm trước");
                            }
                        }
                    }

                    // Update import data from first valid row only
                    if (cols == dataRows.First())
                    {
                        // Update import data from file (whether new or existing)
                        singleImport.Employee = cols.ElementAtOrDefault(Array.IndexOf(header, "Employee")) ?? "admin 66";
                        singleImport.ImportType = cols.ElementAtOrDefault(Array.IndexOf(header, "ImportType")) ?? string.Empty;
                        singleImport.Supplier = cols.ElementAtOrDefault(Array.IndexOf(header, "Supplier")) ?? string.Empty;
                        singleImport.Invoice = cols.ElementAtOrDefault(Array.IndexOf(header, "Invoice")) ?? string.Empty;
                        singleImport.Note = string.Empty;

                        // Parse date fields
                        var dateStr = cols.ElementAtOrDefault(Array.IndexOf(header, "Date(DD/MM/YYYY)"));
                        if (!string.IsNullOrEmpty(dateStr))
                        {
                            if (DateTime.TryParse(dateStr, out var d)) singleImport.Date = d;
                            else if (DateTime.TryParseExact(dateStr, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var dd)) singleImport.Date = dd;
                        }
                        
                        var invoiceDateStr = cols.ElementAtOrDefault(Array.IndexOf(header, "InvoiceDate(DD/MM/YYYY)"));
                        if (!string.IsNullOrEmpty(invoiceDateStr))
                        {
                            if (DateTime.TryParse(invoiceDateStr, out var id)) singleImport.InvoiceDate = id;
                            else if (DateTime.TryParseExact(invoiceDateStr, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var idd)) singleImport.InvoiceDate = idd;
                        }
                        else
                        {
                            singleImport.InvoiceDate = singleImport.Date; // Default to import date
                        }

                        // Parse numeric fields
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Total")), out var total)) singleImport.Total = total;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "TotalWeight")), out var tw)) singleImport.TotalWeight = tw;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "TotalVolume")), out var tv)) singleImport.TotalVolume = tv;
                    }

                    // Only create item if there's actual item data
                    var hasItemData = !string.IsNullOrWhiteSpace(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.ProductCode")) ?? "") ||
                                     !string.IsNullOrWhiteSpace(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.ProductName")) ?? "") ||
                                     !string.IsNullOrWhiteSpace(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Barcode")) ?? "");
                    
                    if (hasItemData && singleImport != null)
                    {
                        var item = new ImportItem();
                        item.Barcode = cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Barcode")) ?? string.Empty;
                        item.ProductCode = cols.ElementAtOrDefault(Array.IndexOf(header, "Item.ProductCode")) ?? string.Empty;
                        item.ProductName = cols.ElementAtOrDefault(Array.IndexOf(header, "Item.ProductName")) ?? string.Empty;
                        item.Description = cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Description")) ?? string.Empty;
                        item.Unit = cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Unit")) ?? string.Empty;
                        item.Specification = string.Empty; // Not in template
                        item.Warehouse = cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Warehouse")) ?? string.Empty;
                        item.Note = cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Note")) ?? string.Empty;
                        
                        // Parse numeric fields
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Conversion")), out var conv)) item.Conversion = conv;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Quantity")), out var qty)) item.Quantity = qty;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.UnitPrice")), out var up)) item.UnitPrice = up;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.TransportCost")), out var tc)) item.TransportCost = tc;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Total")), out var tot)) item.Total = tot;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.TotalTransport")), out var ttot)) item.TotalTransport = ttot;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Weight")), out var w)) item.Weight = w;
                        if (decimal.TryParse(cols.ElementAtOrDefault(Array.IndexOf(header, "Item.Volume")), out var v)) item.Volume = v;
                        
                        // Parse date field
                        var noteDateStr = cols.ElementAtOrDefault(Array.IndexOf(header, "Item.NoteDate(DD/MM/YYYY)"));
                        if (!string.IsNullOrEmpty(noteDateStr))
                        {
                            if (DateTime.TryParse(noteDateStr, out var nd)) item.NoteDate = nd;
                            else if (DateTime.TryParseExact(noteDateStr, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var ndd)) item.NoteDate = ndd;
                        }

                        singleImport.Items.Add(item);
                    }
                }

                // Persist the single import with all its items
                if (singleImport != null)
                {
                    // Always add new import to context
                    _context.Imports.Add(singleImport);
                    
                    await _context.SaveChangesAsync();
                    return Ok(new { imported = 1, importNumber = singleImport.ImportNumber, itemsCount = singleImport.Items.Count });
                }

                return Ok(new { imported = 0 });
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.ToString(), title: "Import template error");
            }
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
            var day = today.Day.ToString("00");
            var month = today.Month.ToString("00");
            var year = today.Year.ToString();
            var timestamp = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString().Substring(8); // Last 5 digits for uniqueness
            return $"PN-{day}{month}{year}-{timestamp}";
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
