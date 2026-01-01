using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class WarehouseTransfer
    {
        public int Id { get; set; }

        [MaxLength(100)]
        public string TransferNumber { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        [MaxLength(1000)]
        public string Note { get; set; } = string.Empty;

        [MaxLength(250)]
        public string Employee { get; set; } = string.Empty;

        [MaxLength(100)]
        public string TransferType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string ImportType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string ExportType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string SourceWarehouse { get; set; } = string.Empty;

        [MaxLength(100)]
        public string DestWarehouse { get; set; } = string.Empty;

        public decimal Total { get; set; }

        public decimal TotalWeight { get; set; }

        public decimal TotalVolume { get; set; }

        [MaxLength(500)]
        public string TotalText { get; set; } = string.Empty;

        public ICollection<WarehouseTransferItem> Items { get; set; } = new List<WarehouseTransferItem>();
    }
}
