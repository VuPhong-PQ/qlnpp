namespace QlnppApi.Models
{
    public class CompanyInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public string Logo { get; set; } = string.Empty;
        public string Representative { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
    }
}
