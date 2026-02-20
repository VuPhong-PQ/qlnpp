using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBangKeTongHoaDonColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NgayHoaDon",
                table: "BangKeTongHoaDons");

            migrationBuilder.RenameColumn(
                name: "TrangThai",
                table: "BangKeTongHoaDons",
                newName: "NvSale");

            migrationBuilder.RenameColumn(
                name: "SoHoaDon",
                table: "BangKeTongHoaDons",
                newName: "MaPhieu");

            migrationBuilder.AddColumn<string>(
                name: "LoaiHang",
                table: "BangKeTongHoaDons",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "TongTienSauGiam",
                table: "BangKeTongHoaDons",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LoaiHang",
                table: "BangKeTongHoaDons");

            migrationBuilder.DropColumn(
                name: "TongTienSauGiam",
                table: "BangKeTongHoaDons");

            migrationBuilder.RenameColumn(
                name: "NvSale",
                table: "BangKeTongHoaDons",
                newName: "TrangThai");

            migrationBuilder.RenameColumn(
                name: "MaPhieu",
                table: "BangKeTongHoaDons",
                newName: "SoHoaDon");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayHoaDon",
                table: "BangKeTongHoaDons",
                type: "datetime2",
                nullable: true);
        }
    }
}
