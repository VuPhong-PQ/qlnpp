using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBangKeTongItemColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NvSale",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "TongTien",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "TongTienSauGiam",
                table: "BangKeTongItems");

            migrationBuilder.RenameColumn(
                name: "TenKhachHang",
                table: "BangKeTongItems",
                newName: "TenHang");

            migrationBuilder.AddColumn<string>(
                name: "DonViGoc",
                table: "BangKeTongItems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DonViTinh1",
                table: "BangKeTongItems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MaHang",
                table: "BangKeTongItems",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MaVach",
                table: "BangKeTongItems",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MoTa",
                table: "BangKeTongItems",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "QuyDoi",
                table: "BangKeTongItems",
                type: "decimal(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SlBanTheoDVTGoc",
                table: "BangKeTongItems",
                type: "decimal(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SoLuongDVT1",
                table: "BangKeTongItems",
                type: "decimal(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SoLuongDVTGoc",
                table: "BangKeTongItems",
                type: "decimal(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DonViGoc",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "DonViTinh1",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "MaHang",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "MaVach",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "MoTa",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "QuyDoi",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "SlBanTheoDVTGoc",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "SoLuongDVT1",
                table: "BangKeTongItems");

            migrationBuilder.DropColumn(
                name: "SoLuongDVTGoc",
                table: "BangKeTongItems");

            migrationBuilder.RenameColumn(
                name: "TenHang",
                table: "BangKeTongItems",
                newName: "TenKhachHang");

            migrationBuilder.AddColumn<string>(
                name: "NvSale",
                table: "BangKeTongItems",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "TongTien",
                table: "BangKeTongItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TongTienSauGiam",
                table: "BangKeTongItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }
    }
}
