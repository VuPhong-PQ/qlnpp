namespace QlnppApi.Models
{
    public class Supplier
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string VatName { get; set; } = string.Empty;
        public string VatExportName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string VatAddress { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Fax { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty;
        public string Account { get; set; } = string.Empty;
        public string CustomerGroup { get; set; } = string.Empty;
        public string CustomerType { get; set; } = string.Empty;
        public string SalesSchedule { get; set; } = string.Empty;
        public string Vehicle { get; set; } = string.Empty;
        public int PrintOrder { get; set; }
        public string BusinessType { get; set; } = string.Empty;
        public decimal DebtLimit { get; set; }
        public string DebtTerm { get; set; } = string.Empty;
        public decimal InitialDebt { get; set; }
        public string Note { get; set; } = string.Empty;
        public bool ExportVAT { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}

