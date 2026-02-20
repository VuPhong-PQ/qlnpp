using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class AddBangKeTong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BangKeTongs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ImportNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Employee = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    ImportType = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DsHoaDon = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BangKeTongs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BangKeTongHoaDons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BangKeTongId = table.Column<int>(type: "int", nullable: false),
                    SoHoaDon = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NgayHoaDon = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TenKhachHang = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TongTien = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BangKeTongHoaDons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BangKeTongHoaDons_BangKeTongs_BangKeTongId",
                        column: x => x.BangKeTongId,
                        principalTable: "BangKeTongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BangKeTongItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BangKeTongId = table.Column<int>(type: "int", nullable: false),
                    MaPhieu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TenKhachHang = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TongTien = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TongTienSauGiam = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    NvSale = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    LoaiHang = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BangKeTongItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BangKeTongItems_BangKeTongs_BangKeTongId",
                        column: x => x.BangKeTongId,
                        principalTable: "BangKeTongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BangKeTongHoaDons_BangKeTongId",
                table: "BangKeTongHoaDons",
                column: "BangKeTongId");

            migrationBuilder.CreateIndex(
                name: "IX_BangKeTongItems_BangKeTongId",
                table: "BangKeTongItems",
                column: "BangKeTongId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BangKeTongHoaDons");

            migrationBuilder.DropTable(
                name: "BangKeTongItems");

            migrationBuilder.DropTable(
                name: "BangKeTongs");
        }
    }
}
