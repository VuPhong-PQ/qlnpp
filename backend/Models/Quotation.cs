using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class Quotation
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Code { get; set; }

        public DateTime Date { get; set; }

        [MaxLength(200)]
        public string QuotationType { get; set; }

        [MaxLength(1000)]
        public string Note { get; set; }

        [MaxLength(250)]
        public string Employee { get; set; }

        public decimal Total { get; set; }

        public ICollection<QuotationItem> Items { get; set; }
    }
}
