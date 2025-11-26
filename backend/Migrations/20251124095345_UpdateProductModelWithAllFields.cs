using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductModelWithAllFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Conversion2",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<decimal>(
                name: "Conversion1",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<decimal>(
                name: "Conversion3",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Conversion4",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ImportPrice",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ImportPrice1",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ImportPrice2",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ImportPrice3",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ImportPrice4",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RetailDiscount1",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RetailDiscount2",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RetailDiscount3",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RetailDiscount4",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RetailPrice2",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RetailPrice3",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RetailPrice4",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingFee",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingFee1",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingFee2",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingFee3",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingFee4",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Unit3",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Unit4",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "Volume3",
                table: "Products",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Volume4",
                table: "Products",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Weight3",
                table: "Products",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Weight4",
                table: "Products",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "WholesaleDiscount1",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WholesaleDiscount2",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WholesaleDiscount3",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WholesaleDiscount4",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WholesalePrice2",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WholesalePrice3",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WholesalePrice4",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Conversion3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Conversion4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ImportPrice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ImportPrice1",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ImportPrice2",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ImportPrice3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ImportPrice4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RetailDiscount1",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RetailDiscount2",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RetailDiscount3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RetailDiscount4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RetailPrice2",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RetailPrice3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RetailPrice4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShippingFee",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShippingFee1",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShippingFee2",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShippingFee3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShippingFee4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Unit3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Unit4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Volume3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Volume4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Weight3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Weight4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WholesaleDiscount1",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WholesaleDiscount2",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WholesaleDiscount3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WholesaleDiscount4",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WholesalePrice2",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WholesalePrice3",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WholesalePrice4",
                table: "Products");

            migrationBuilder.AlterColumn<int>(
                name: "Conversion2",
                table: "Products",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<int>(
                name: "Conversion1",
                table: "Products",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");
        }
    }
}
