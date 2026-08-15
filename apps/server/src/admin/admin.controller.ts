import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '@water-business/shared-types';

@Controller('api/v1/admin')
@UseGuards(AuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // 1. Branches
  @Get('branches')
  async getBranches() {
    return this.adminService.getAllBranches();
  }

  @Post('branches')
  async saveBranch(@Body() body: any, @Request() req: any) {
    return this.adminService.saveBranch(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 2. Stores
  @Get('stores')
  async getStores() {
    return this.adminService.getAllStores();
  }

  @Post('stores')
  async saveStore(@Body() body: any, @Request() req: any) {
    return this.adminService.saveStore(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 3. Departments
  @Get('departments')
  async getDepartments() {
    return this.adminService.getAllDepartments();
  }

  @Post('departments')
  async saveDepartment(@Body() body: any, @Request() req: any) {
    return this.adminService.saveDepartment(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 4. Workers
  @Get('workers')
  async getWorkers() {
    return this.adminService.getAllWorkers();
  }

  @Post('workers')
  async saveWorker(@Body() body: any, @Request() req: any) {
    return this.adminService.saveWorker(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 5. Users
  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users')
  async saveUser(@Body() body: any, @Request() req: any) {
    return this.adminService.saveUser(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 6. Roles
  @Get('roles')
  async getRoles() {
    return this.adminService.getAllRoles();
  }

  @Post('roles')
  async saveRole(@Body() body: any, @Request() req: any) {
    return this.adminService.saveRole(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 7. Vehicles
  @Get('vehicles')
  async getVehicles() {
    return this.adminService.getAllVehicles();
  }

  @Post('vehicles')
  async saveVehicle(@Body() body: any, @Request() req: any) {
    return this.adminService.saveVehicle(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 8. Products
  @Get('products')
  async getProducts() {
    return this.adminService.getAllProducts();
  }

  @Post('products')
  async saveProduct(@Body() body: any, @Request() req: any) {
    return this.adminService.saveProduct(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 9. Categories
  @Get('categories')
  async getCategories() {
    return this.adminService.getAllCategories();
  }

  @Post('categories')
  async saveCategory(@Body() body: any, @Request() req: any) {
    return this.adminService.saveCategory(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 10. Prices (Branch Product Prices)
  @Get('prices')
  async getPrices() {
    return this.adminService.getAllBranchPrices();
  }

  @Post('prices')
  async savePrice(@Body() body: any, @Request() req: any) {
    return this.adminService.saveBranchPrice(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 11. Payment Methods
  @Get('payment-methods')
  async getPaymentMethods() {
    return this.adminService.getAllPaymentMethods();
  }

  @Post('payment-methods')
  async savePaymentMethod(@Body() body: any, @Request() req: any) {
    return this.adminService.savePaymentMethod(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 12. Expense Types
  @Get('expense-types')
  async getExpenseTypes() {
    return this.adminService.getAllExpenseTypes();
  }

  @Post('expense-types')
  async saveExpenseType(@Body() body: any, @Request() req: any) {
    return this.adminService.saveExpenseType(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 13. Debt Types
  @Get('debt-types')
  async getDebtTypes() {
    return this.adminService.getAllDebtTypes();
  }

  @Post('debt-types')
  async saveDebtType(@Body() body: any, @Request() req: any) {
    return this.adminService.saveDebtType(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 14. Salary Settings
  @Get('salary-settings')
  async getSalarySettings() {
    return this.adminService.getAllSalarySettings();
  }

  @Post('salary-settings')
  async saveSalarySetting(@Body() body: any, @Request() req: any) {
    return this.adminService.saveSalarySetting(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }

  // 15. System Settings
  @Get('system-settings')
  async getSystemSettings() {
    return this.adminService.getAllSystemSettings();
  }

  @Post('system-settings')
  async saveSystemSetting(@Body() body: any, @Request() req: any) {
    return this.adminService.saveSystemSetting(body, req.user?.sub || 'u1111111-1111-1111-1111-111111111111');
  }
}
