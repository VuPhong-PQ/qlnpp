using Microsoft.EntityFrameworkCore;
using QlnppApi.Models;

namespace QlnppApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<CustomerGroup> CustomerGroups { get; set; }
        public DbSet<ProductCategory> ProductCategories { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<AccountFund> AccountFunds { get; set; }
        public DbSet<TransactionContent> TransactionContents { get; set; }
        public DbSet<CompanyInfo> CompanyInfos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure decimal precision
            modelBuilder.Entity<Product>()
                .Property(p => p.RetailPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesalePrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.RetailPrice1)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesalePrice1)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.Discount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Customer>()
                .Property(c => c.DebtLimit)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Customer>()
                .Property(c => c.InitialDebt)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAfterDiscount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Supplier>()
                .Property(s => s.DebtLimit)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Supplier>()
                .Property(s => s.InitialDebt)
                .HasPrecision(18, 2);

            modelBuilder.Entity<AccountFund>()
                .Property(a => a.InitialBalance)
                .HasPrecision(18, 2);
        }
    }
}
