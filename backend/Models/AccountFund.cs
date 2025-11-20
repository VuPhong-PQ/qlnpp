namespace QlnppApi.Models
{
    public class AccountFund
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AccountHolder { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string Bank { get; set; } = string.Empty;
        public string Branch { get; set; } = string.Empty;
        public decimal InitialBalance { get; set; }
        public string Note { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
