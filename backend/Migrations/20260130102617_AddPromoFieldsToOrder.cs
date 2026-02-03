using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPromoFieldsToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PromoDiscountAmount",
                table: "Orders",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PromoDiscountNote",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "PromoDiscountPercent",
                table: "Orders",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PromoNotes",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "PromoTotalKg",
                table: "Orders",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PromoTotalM3",
                table: "Orders",
                type: "decimal(18,3)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PromoDiscountAmount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PromoDiscountNote",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PromoDiscountPercent",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PromoNotes",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PromoTotalKg",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PromoTotalM3",
                table: "Orders");
        }
    }
}
