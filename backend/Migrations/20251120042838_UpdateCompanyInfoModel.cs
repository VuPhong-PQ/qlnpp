using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCompanyInfoModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Website",
                table: "CompanyInfos",
                newName: "TransferNote");

            migrationBuilder.RenameColumn(
                name: "TaxCode",
                table: "CompanyInfos",
                newName: "CompanyName");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "CompanyInfos",
                newName: "BusinessCode");

            migrationBuilder.RenameColumn(
                name: "Logo",
                table: "CompanyInfos",
                newName: "BankName");

            migrationBuilder.AddColumn<string>(
                name: "AccountNumber",
                table: "CompanyInfos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccountNumber",
                table: "CompanyInfos");

            migrationBuilder.RenameColumn(
                name: "TransferNote",
                table: "CompanyInfos",
                newName: "Website");

            migrationBuilder.RenameColumn(
                name: "CompanyName",
                table: "CompanyInfos",
                newName: "TaxCode");

            migrationBuilder.RenameColumn(
                name: "BusinessCode",
                table: "CompanyInfos",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "BankName",
                table: "CompanyInfos",
                newName: "Logo");
        }
    }
}
