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
        public string ImportNumber { get; set; }

        public DateTime Date { get; set; }

        [MaxLength(1000)]
        public string Note { get; set; }

        [MaxLength(250)]
        public string Employee { get; set; }

        public decimal Total { get; set; }

        public ICollection<ImportItem> Items { get; set; }
    }
}
