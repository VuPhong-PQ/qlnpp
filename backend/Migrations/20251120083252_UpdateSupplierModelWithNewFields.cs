using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSupplierModelWithNewFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ContactPhone",
                table: "Suppliers",
                newName: "Vehicle");

            migrationBuilder.RenameColumn(
                name: "ContactPerson",
                table: "Suppliers",
                newName: "VatExportName");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Suppliers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BusinessType",
                table: "Suppliers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerGroup",
                table: "Suppliers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerType",
                table: "Suppliers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "ExportVAT",
                table: "Suppliers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Fax",
                table: "Suppliers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "PrintOrder",
                table: "Suppliers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SalesSchedule",
                table: "Suppliers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "BusinessType",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "CustomerGroup",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "CustomerType",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "ExportVAT",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "Fax",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "PrintOrder",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "SalesSchedule",
                table: "Suppliers");

            migrationBuilder.RenameColumn(
                name: "Vehicle",
                table: "Suppliers",
                newName: "ContactPhone");

            migrationBuilder.RenameColumn(
                name: "VatExportName",
                table: "Suppliers",
                newName: "ContactPerson");
        }
    }
}
