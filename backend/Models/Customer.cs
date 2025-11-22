namespace QlnppApi.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public string CustomerGroup { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string VatName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string VatAddress { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Account { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty;
        public string CustomerType { get; set; } = string.Empty;
        public string SalesSchedule { get; set; } = string.Empty;
        public string Vehicle { get; set; } = string.Empty;
        public string PrintIn { get; set; } = string.Empty;
        public string BusinessType { get; set; } = string.Empty;
        public decimal DebtLimit { get; set; }
        public string DebtTerm { get; set; } = string.Empty;
        public decimal InitialDebt { get; set; }
        public string Note { get; set; } = string.Empty;
        public bool ExportVat { get; set; }
        public bool IsInactive { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
