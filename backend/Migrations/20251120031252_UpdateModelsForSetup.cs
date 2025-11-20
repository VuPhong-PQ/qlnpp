using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelsForSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Units",
                newName: "Note");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "TransactionContents",
                newName: "Note");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "ProductCategories",
                newName: "Note");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "CustomerGroups",
                newName: "SalesSchedule");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "AccountFunds",
                newName: "Note");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "AccountFunds",
                newName: "Branch");

            migrationBuilder.RenameColumn(
                name: "Balance",
                table: "AccountFunds",
                newName: "InitialBalance");

            migrationBuilder.AddColumn<bool>(
                name: "NoGroupOrder",
                table: "ProductCategories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "CustomerGroups",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AccountHolder",
                table: "AccountFunds",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AccountNumber",
                table: "AccountFunds",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Bank",
                table: "AccountFunds",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NoGroupOrder",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "CustomerGroups");

            migrationBuilder.DropColumn(
                name: "AccountHolder",
                table: "AccountFunds");

            migrationBuilder.DropColumn(
                name: "AccountNumber",
                table: "AccountFunds");

            migrationBuilder.DropColumn(
                name: "Bank",
                table: "AccountFunds");

            migrationBuilder.RenameColumn(
                name: "Note",
                table: "Units",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "Note",
                table: "TransactionContents",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "Note",
                table: "ProductCategories",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "SalesSchedule",
                table: "CustomerGroups",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "Note",
                table: "AccountFunds",
                newName: "Type");

            migrationBuilder.RenameColumn(
                name: "InitialBalance",
                table: "AccountFunds",
                newName: "Balance");

            migrationBuilder.RenameColumn(
                name: "Branch",
                table: "AccountFunds",
                newName: "Description");
        }
    }
}
