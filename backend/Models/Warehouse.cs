namespace QlnppApi.Models
{
    public class Warehouse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Manager { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
