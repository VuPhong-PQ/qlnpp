using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QlnppApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PermissionGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PermissionGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductCategoryPermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ProductCategoryId = table.Column<int>(type: "int", nullable: false),
                    CanView = table.Column<bool>(type: "bit", nullable: false),
                    CanAdd = table.Column<bool>(type: "bit", nullable: false),
                    CanEdit = table.Column<bool>(type: "bit", nullable: false),
                    CanDelete = table.Column<bool>(type: "bit", nullable: false),
                    CanViewPrice = table.Column<bool>(type: "bit", nullable: false),
                    CanEditPrice = table.Column<bool>(type: "bit", nullable: false),
                    CanViewStock = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductCategoryPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductCategoryPermissions_ProductCategories_ProductCategoryId",
                        column: x => x.ProductCategoryId,
                        principalTable: "ProductCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductCategoryPermissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReportCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReportPermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ReportKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ReportName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CanView = table.Column<bool>(type: "bit", nullable: false),
                    CanPrint = table.Column<bool>(type: "bit", nullable: false),
                    CanExport = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReportPermissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WarehousePermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    CanView = table.Column<bool>(type: "bit", nullable: false),
                    CanImport = table.Column<bool>(type: "bit", nullable: false),
                    CanExport = table.Column<bool>(type: "bit", nullable: false),
                    CanTransfer = table.Column<bool>(type: "bit", nullable: false),
                    CanViewStock = table.Column<bool>(type: "bit", nullable: false),
                    CanAdjustStock = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WarehousePermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WarehousePermissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WarehousePermissions_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PermissionGroupDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PermissionGroupId = table.Column<int>(type: "int", nullable: false),
                    ResourceKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ResourceName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CanView = table.Column<bool>(type: "bit", nullable: false),
                    CanAdd = table.Column<bool>(type: "bit", nullable: false),
                    CanEdit = table.Column<bool>(type: "bit", nullable: false),
                    CanDelete = table.Column<bool>(type: "bit", nullable: false),
                    CanPrint = table.Column<bool>(type: "bit", nullable: false),
                    CanImport = table.Column<bool>(type: "bit", nullable: false),
                    CanExport = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PermissionGroupDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PermissionGroupDetails_PermissionGroups_PermissionGroupId",
                        column: x => x.PermissionGroupId,
                        principalTable: "PermissionGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserPermissionGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PermissionGroupId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPermissionGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPermissionGroups_PermissionGroups_PermissionGroupId",
                        column: x => x.PermissionGroupId,
                        principalTable: "PermissionGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPermissionGroups_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PermissionGroupDetails_PermissionGroupId",
                table: "PermissionGroupDetails",
                column: "PermissionGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategoryPermissions_ProductCategoryId",
                table: "ProductCategoryPermissions",
                column: "ProductCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategoryPermissions_UserId",
                table: "ProductCategoryPermissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportPermissions_UserId",
                table: "ReportPermissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissionGroups_PermissionGroupId",
                table: "UserPermissionGroups",
                column: "PermissionGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissionGroups_UserId",
                table: "UserPermissionGroups",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WarehousePermissions_UserId",
                table: "WarehousePermissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WarehousePermissions_WarehouseId",
                table: "WarehousePermissions",
                column: "WarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PermissionGroupDetails");

            migrationBuilder.DropTable(
                name: "ProductCategoryPermissions");

            migrationBuilder.DropTable(
                name: "ReportCategories");

            migrationBuilder.DropTable(
                name: "ReportPermissions");

            migrationBuilder.DropTable(
                name: "UserPermissionGroups");

            migrationBuilder.DropTable(
                name: "WarehousePermissions");

            migrationBuilder.DropTable(
                name: "PermissionGroups");
        }
    }
}
