using System;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class ProductCategoryPermission
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public int ProductCategoryId { get; set; }
        public ProductCategory? ProductCategory { get; set; }
        
        public bool CanView { get; set; }
        public bool CanAdd { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanViewPrice { get; set; }
        public bool CanEditPrice { get; set; }
        public bool CanViewStock { get; set; }
    }
}
