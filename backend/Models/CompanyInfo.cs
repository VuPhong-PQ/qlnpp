namespace QlnppApi.Models
{
    public class CompanyInfo
    {
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string BusinessCode { get; set; } = string.Empty;
        public string Representative { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string TransferNote { get; set; } = string.Empty;
    }
}
