namespace QlnppApi.Models
{
    public class Supplier
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string VatName { get; set; } = string.Empty;
        public string VatAddress { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty;
        public string Account { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public decimal DebtLimit { get; set; }
        public string DebtTerm { get; set; } = string.Empty;
        public decimal InitialDebt { get; set; }
        public string Note { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
