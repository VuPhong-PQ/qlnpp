using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class Import
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string ImportNumber { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        [MaxLength(1000)]
        public string Note { get; set; } = string.Empty;

        [MaxLength(250)]
        public string Employee { get; set; } = string.Empty;

        public decimal Total { get; set; }

        public ICollection<ImportItem> Items { get; set; } = new List<ImportItem>();
    }
}
