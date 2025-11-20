namespace QlnppApi.Models
{
    public class BankLoan
    {
        public int Id { get; set; }
        public string AccountNumber { get; set; } = string.Empty;
        public string LoanName { get; set; } = string.Empty;
        public DateTime LoanDate { get; set; }
        public DateTime DueDate { get; set; }
        public string InterestPeriod { get; set; } = string.Empty;
        public decimal InterestCost { get; set; }
        public decimal PrincipalPayment { get; set; }
        public decimal PrincipalAmount { get; set; }
        public string Note { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
