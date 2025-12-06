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
        public DbSet<BankLoan> BankLoans { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserPermission> UserPermissions { get; set; }
        public DbSet<GroupPermission> GroupPermissions { get; set; }
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<QuotationItem> QuotationItems { get; set; }
        public DbSet<Import> Imports { get; set; }
        public DbSet<ImportItem> ImportItems { get; set; }
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

            modelBuilder.Entity<BankLoan>()
                .Property(b => b.InterestCost)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BankLoan>()
                .Property(b => b.PrincipalPayment)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BankLoan>()
                .Property(b => b.PrincipalAmount)
                .HasPrecision(18, 2);

            // Vehicle decimal configurations
            modelBuilder.Entity<Vehicle>()
                .Property(v => v.LoadCapacity)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.Volume)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.PurchasePrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.DepreciationValue)
                .HasPrecision(18, 2);

            // Missing Product decimal configurations
            modelBuilder.Entity<Product>()
                .Property(p => p.WholesalePrice2)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesalePrice3)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesalePrice4)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesaleDiscount3)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesaleDiscount4)
                .HasPrecision(18, 2);

            // Thêm cấu hình HasPrecision cho các thuộc tính decimal còn thiếu
            modelBuilder.Entity<Product>()
                .Property(p => p.Conversion1)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.Conversion2)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.Conversion3)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.Conversion4)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ImportPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ImportPrice1)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ImportPrice2)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ImportPrice3)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ImportPrice4)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.RetailPrice2)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.RetailPrice3)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.RetailPrice4)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.RetailDiscount1)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.RetailDiscount2)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.RetailDiscount3)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.RetailDiscount4)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesalePrice2)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesalePrice3)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesalePrice4)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesaleDiscount1)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.WholesaleDiscount2)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ShippingFee)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ShippingFee1)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ShippingFee2)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ShippingFee3)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.ShippingFee4)
                .HasPrecision(18, 2);

            // Import / ImportItem configuration
            // ImportItem numeric properties have Column attributes, but configure precision explicitly
            modelBuilder.Entity<ImportItem>()
                .Property(i => i.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ImportItem>()
                .Property(i => i.Total)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ImportItem>()
                .Property(i => i.Weight)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ImportItem>()
                .Property(i => i.Volume)
                .HasPrecision(18, 2);

            // Import header precision
            modelBuilder.Entity<Import>()
                .Property(i => i.Total)
                .HasPrecision(18, 2);

            // User & Permissions
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Username).HasMaxLength(200);
                entity.Property(u => u.Email).HasMaxLength(250);
            });

            modelBuilder.Entity<UserPermission>(entity =>
            {
                entity.HasKey(up => up.Id);
                entity.HasOne(up => up.User)
                      .WithMany(u => u.Permissions)
                      .HasForeignKey(up => up.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.Property(up => up.ResourceKey).HasMaxLength(200);
            });

            modelBuilder.Entity<GroupPermission>(entity =>
            {
                entity.HasKey(gp => gp.Id);
                entity.Property(gp => gp.ResourceKey).IsRequired().HasMaxLength(200);
            });

            modelBuilder.Entity<Quotation>(entity =>
            {
                entity.HasKey(q => q.Id);
                entity.Property(q => q.Code).HasMaxLength(100).IsRequired();
                entity.Property(q => q.QuotationType).HasMaxLength(200);
                entity.Property(q => q.Note).HasMaxLength(1000);
                entity.Property(q => q.Employee).HasMaxLength(250);
                entity.Property(q => q.Total).HasPrecision(18, 2);
            });

            modelBuilder.Entity<QuotationItem>(entity =>
            {
                entity.HasKey(i => i.Id);
                entity.HasOne(i => i.Quotation).WithMany(q => q.Items).HasForeignKey(i => i.QuotationId).OnDelete(DeleteBehavior.Cascade);
                entity.Property(i => i.Price).HasPrecision(18, 2);
                entity.Property(i => i.Price1).HasPrecision(18, 2);
            });
        }
    }
}
