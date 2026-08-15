import { z } from 'zod';
import { UserRole, StoreType, VehicleType, StockMovementType, PaymentMethod, TransferStatus } from '@water-business/shared-types';

export const UserRegistrationSchema = z.object({
  username: z.string().min(3).max(50),
  fullName: z.string().min(2).max(100),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
  branchId: z.string().uuid(),
  storeId: z.string().uuid().optional(),
});

export const ProductSchema = z.object({
  sku: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  unitOfMeasure: z.string().min(1).max(20),
  capacityMl: z.number().int().positive(),
  costPriceUgx: z.number().int().nonnegative(),
  sellingPriceUgx: z.number().int().nonnegative(),
  minStockAlert: z.number().int().nonnegative().default(10),
  maxStockLevel: z.number().int().positive().default(1000),
});

export const StockReceiptSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitCostUgx: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

export const StockTransferCreateSchema = z.object({
  sourceStoreId: z.string().uuid(),
  destinationStoreId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  driverWorkerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantityRequested: z.number().int().positive(),
    unitPriceUgx: z.number().int().nonnegative(),
  })).min(1),
  notes: z.string().optional(),
});

export const StockTransferStatusUpdateSchema = z.object({
  transferId: z.string().uuid(),
  status: z.nativeEnum(TransferStatus),
  receivedItems: z.array(z.object({
    productId: z.string().uuid(),
    quantityReceived: z.number().int().nonnegative(),
  })).optional(),
  notes: z.string().optional(),
});

export const CreateSaleSchema = z.object({
  storeId: z.string().uuid(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPriceUgx: z.number().int().nonnegative(),
    discountUgx: z.number().int().nonnegative().default(0),
  })).min(1),
  discountAmountUgx: z.number().int().nonnegative().default(0),
  paidAmountUgx: z.number().int().nonnegative(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentReference: z.string().optional(),
});

export const StartFieldSessionSchema = z.object({
  storeId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  workerId: z.string().uuid(),
  issuedItems: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPriceUgx: z.number().int().nonnegative(),
  })).min(1),
});

export const CloseFieldSessionSchema = z.object({
  fieldSessionId: z.string().uuid(),
  returnedItems: z.array(z.object({
    productId: z.string().uuid(),
    soldQty: z.number().int().nonnegative(),
    returnedQty: z.number().int().nonnegative(),
    damagedQty: z.number().int().nonnegative(),
    missingQty: z.number().int().nonnegative().default(0),
  })).min(1),
  cashCollectedUgx: z.number().int().nonnegative(),
  mobileMoneyUgx: z.number().int().nonnegative().default(0),
  bankDepositUgx: z.number().int().nonnegative().default(0),
  approvedExpensesUgx: z.number().int().nonnegative().default(0),
  cashRemainingUgx: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});

export const CreateExpenseSchema = z.object({
  branchId: z.string().uuid(),
  storeId: z.string().uuid().optional(),
  fieldSessionId: z.string().uuid().optional(),
  category: z.string().min(2),
  amountUgx: z.number().int().positive(),
  description: z.string().min(3),
});

export const DebtPaymentSchema = z.object({
  debtId: z.string().uuid(),
  amountPaidUgx: z.number().int().positive(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

export const SyncIngestBatchSchema = z.object({
  deviceId: z.string().min(1),
  branchId: z.string().uuid(),
  transactions: z.array(z.object({
    id: z.string().uuid(),
    transactionType: z.string(),
    payload: z.record(z.any()),
    version: z.number().int().positive(),
    createdAt: z.string(),
  })).min(1),
});
