import React, { useState } from 'react';
import {
  Package,
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Trash2,
  Building2,
  Truck,
  CheckCircle,
  XCircle,
  Inbox,
  SlidersHorizontal,
  Edit3,
  AlertOctagon,
} from 'lucide-react';
import { useStore, StockTransferRecord } from '../store/useStore';
import { hasPermission } from '../utils/rbac';
import { v4 as uuidv4 } from 'uuid';

export const StockView: React.FC = () => {
  const {
    user,
    branches,
    stores,
    currentBranchId,
    currentStoreId,
    products,
    vehicles,
    inventoryStock,
    stockTransfersList,
    addStockIntake,
    adjustStock,
    createStockTransfer,
    advanceTransferStatus,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'transfers'>('inventory');
  const [storeFilterMode, setStoreFilterMode] = useState<'BRANCH' | 'ALL'>('BRANCH');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const branchStores = stores.filter((s) => !currentBranchId || s.branchId === currentBranchId);
  const visibleStores = storeFilterMode === 'BRANCH' ? branchStores : stores;

  // Goods Intake Form State
  const [intakeStoreId, setIntakeStoreId] = useState(currentStoreId || branchStores[0]?.id || stores[0]?.id || '');
  const [intakeProductId, setIntakeProductId] = useState(products[0]?.id || '');
  const [intakeQty, setIntakeQty] = useState(500);
  const [intakeUnitCost, setIntakeUnitCost] = useState(500);
  const [intakeBatchRef, setIntakeBatchRef] = useState(`BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`);
  const [intakeNotes, setIntakeNotes] = useState('Bottling Plant Production Intake');

  // Admin Stock Adjustment Form State
  const [adjustStoreId, setAdjustStoreId] = useState(currentStoreId || branchStores[0]?.id || stores[0]?.id || '');
  const [adjustProductId, setAdjustProductId] = useState(products[0]?.id || '');
  const [adjustNewQty, setAdjustNewQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Data Entry Mistake / Correction');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Draft Transfer Form State
  const [transferSourceStoreId, setTransferSourceStoreId] = useState(currentStoreId || branchStores[0]?.id || stores[0]?.id || '');
  const [transferDestStoreId, setTransferDestStoreId] = useState(stores[1]?.id || stores[0]?.id || '');
  const [transferProductId, setTransferProductId] = useState(products[0]?.id || '');
  const [transferQty, setTransferQty] = useState(200);
  const [transferVehicleName, setTransferVehicleName] = useState(vehicles[0] ? `${vehicles[0].model} (${vehicles[0].registrationNumber})` : 'Isuzu Lorry UBB 450L');

  const canReceiveStock = hasPermission(user?.role, 'RECEIVE_STOCK');
  const canTransferStock = hasPermission(user?.role, 'TRANSFER_STOCK');
  const canAdjustStock = user?.role === 'SUPER_ADMIN' || hasPermission(user?.role, 'ADJUST_STOCK');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAdjustModal = (storeId?: string, productId?: string) => {
    if (!canAdjustStock) {
      setPermissionError('Only administrators can change stock quantities.');
      return;
    }
    setPermissionError(null);
    const targetStore = storeId || currentStoreId || branchStores[0]?.id || stores[0]?.id || '';
    const targetProduct = productId || products[0]?.id || '';
    const currentQty = inventoryStock[targetStore]?.[targetProduct] || 0;

    setAdjustStoreId(targetStore);
    setAdjustProductId(targetProduct);
    setAdjustNewQty(currentQty);
    setAdjustReason('Correction of entry mistake');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdjustStock) {
      alert('Only administrators can change stock quantities.');
      return;
    }
    if (adjustNewQty < 0) {
      alert('Quantity cannot be negative.');
      return;
    }

    const currentQty = inventoryStock[adjustStoreId]?.[adjustProductId] || 0;
    const delta = Number(adjustNewQty) - currentQty;
    const storeName = stores.find((s) => s.id === adjustStoreId)?.name || 'Store';
    const prodName = products.find((p) => p.id === adjustProductId)?.name || 'Product';

    adjustStock({
      storeId: adjustStoreId,
      productId: adjustProductId,
      newQuantity: Number(adjustNewQty),
      reason: adjustReason,
      notes: adjustNotes || `Stock update from ${currentQty} to ${adjustNewQty}`,
    });

    setIsAdjustModalOpen(false);
    notify(
      `Stock updated for ${prodName} in ${storeName}: new quantity is ${Number(adjustNewQty).toLocaleString()} (${delta >= 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()}).`
    );
  };

  const handleGoodsIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intakeQty <= 0) {
      alert('Intake quantity must be greater than 0');
      return;
    }

    addStockIntake({
      storeId: intakeStoreId,
      productId: intakeProductId,
      quantity: Number(intakeQty),
      unitCostUgx: Number(intakeUnitCost),
      batchRef: intakeBatchRef,
      notes: intakeNotes,
    });

    const storeName = stores.find((s) => s.id === intakeStoreId)?.name || 'Store';
    const prodName = products.find((p) => p.id === intakeProductId)?.name || 'Product';

    setIsReceiptModalOpen(false);
    notify(`Successfully received ${intakeQty.toLocaleString()} units of ${prodName} into ${storeName}! Stock ledger credited.`);
  };

  const handleCreateTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferSourceStoreId === transferDestStoreId) {
      alert('Source store and destination store must be different.');
      return;
    }
    if (transferQty <= 0) {
      alert('Transfer quantity must be greater than 0');
      return;
    }

    const srcStore = stores.find((s) => s.id === transferSourceStoreId);
    const dstStore = stores.find((s) => s.id === transferDestStoreId);
    const prod = products.find((p) => p.id === transferProductId);

    const availableInSource = inventoryStock[transferSourceStoreId]?.[transferProductId] || 0;
    if (transferQty > availableInSource) {
      alert(`Insufficient stock in ${srcStore?.name}! Available: ${availableInSource}, Requested: ${transferQty}`);
      return;
    }

    const transferNumber = `TRF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTransfer: StockTransferRecord = {
      id: uuidv4(),
      transferNumber,
      sourceStoreId: transferSourceStoreId,
      sourceStoreName: srcStore?.name || 'Source Store',
      destStoreId: transferDestStoreId,
      destStoreName: dstStore?.name || 'Dest Store',
      productId: transferProductId,
      productName: prod?.name || 'Product',
      quantity: Number(transferQty),
      vehicleName: transferVehicleName,
      status: 'DRAFT',
      date: new Date().toLocaleDateString(),
    };

    createStockTransfer(newTransfer);
    setIsTransferModalOpen(false);
    notify(`Draft Transfer ${transferNumber} created (${transferQty} units of ${prod?.name}). Pending branch manager approval.`);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 shrink-0" />
            <span>Stock Ledger & Transfers</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable stock ledger tracking, goods intake receipts, damages, and branch-to-branch supply transfers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Admin Stock Adjustment Action */}
          {canAdjustStock && (
            <button
              onClick={() => handleOpenAdjustModal()}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 shadow-sm cursor-pointer"
              title="Change or correct stock quantity"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust Stock</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!canReceiveStock) {
                setPermissionError(`Access Denied: Your role (${user?.role}) is not authorized to receive stock or intake goods. Only STOREKEEPER, BRANCH_MANAGER, or SUPER_ADMIN can add stock.`);
                return;
              }
              setPermissionError(null);
              setIsReceiptModalOpen(true);
            }}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              canReceiveStock
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 cursor-pointer'
                : 'bg-slate-900 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed'
            }`}
            title={canReceiveStock ? 'Record new goods intake receipt' : 'Restricted to STOREKEEPER & ADMIN'}
          >
            {canReceiveStock ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Receive Goods</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Transfers ({stockTransfersList.length})
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {permissionError && (
        <div className="bg-rose-950/90 border border-rose-500/60 text-rose-200 p-4 rounded-2xl text-xs flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-slate-100">Role Security Enforcement</div>
              <div>{permissionError}</div>
            </div>
          </div>
          <button onClick={() => setPermissionError(null)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">
              Showing: <strong className="text-slate-200">{storeFilterMode === 'BRANCH' ? 'Selected Branch Stores' : 'All Company Warehouses'}</strong> ({visibleStores.length} Stores)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setStoreFilterMode('BRANCH')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${storeFilterMode === 'BRANCH' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Current Branch Only
              </button>
              <button
                onClick={() => setStoreFilterMode('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${storeFilterMode === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All Branches
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleStores.map((store) => (
            <div key={store.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">{store.name}</h3>
                  <span className="text-[10px] text-cyan-400 font-mono">Code: {store.code}</span>
                </div>
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  {store.type}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {products.map((prod) => {
                  const qty = inventoryStock[store.id]?.[prod.id] || 0;
                  const isLowStock = qty <= prod.minStockAlert;

                  return (
                    <div
                      key={prod.id}
                      className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-200 truncate">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{prod.unitOfMeasure} • SKU: {prod.sku}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-extrabold text-base font-mono ${isLowStock ? 'text-amber-400' : 'text-cyan-400'}`}>
                          {qty.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-semibold ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                          {canAdjustStock && (
                            <button
                              onClick={() => handleOpenAdjustModal(store.id, prod.id)}
                              className="text-[10px] text-slate-300 hover:text-cyan-300 font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Update stock count"
                            >
                              <SlidersHorizontal className="w-2.5 h-2.5 text-cyan-400" />
                              <span>Adjust</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Branch Stock Transfers</h3>
              <p className="text-[11px] text-slate-400">
                Strict 6-Stage Workflow: Draft ➔ Approved ➔ Dispatched ➔ In Transit ➔ Received ➔ Confirmed
              </p>
            </div>
            <button
              onClick={() => {
                if (!canTransferStock) {
                  setPermissionError(`Access Denied: Your role (${user?.role}) is not authorized to initiate branch stock transfers.`);
                  return;
                }
                setPermissionError(null);
                setIsTransferModalOpen(true);
              }}
              className={`btn-touch text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold ${
                canTransferStock
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950 cursor-pointer'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed'
              }`}
            >
              {canTransferStock ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Create Draft Transfer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Ref #</th>
                  <th className="p-3">Source Store</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockTransfersList.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-cyan-400 font-mono">{trf.transferNumber}</td>
                    <td className="p-3 font-semibold text-slate-200">{trf.sourceStoreName}</td>
                    <td className="p-3 text-slate-300">{trf.destStoreName}</td>
                    <td className="p-3">{trf.productName}</td>
                    <td className="p-3 font-bold text-slate-100 font-mono">{trf.quantity.toLocaleString()}</td>
                    <td className="p-3 text-slate-400">{trf.vehicleName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          trf.status === 'DRAFT'
                            ? 'bg-slate-800 border-slate-600 text-slate-300'
                            : trf.status === 'APPROVED'
                            ? 'bg-blue-950 border-blue-500/40 text-blue-400'
                            : trf.status === 'DISPATCHED' || trf.status === 'IN_TRANSIT'
                            ? 'bg-amber-950 border-amber-500/40 text-amber-400'
                            : trf.status === 'RECEIVED'
                            ? 'bg-purple-950 border-purple-500/40 text-purple-400'
                            : 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                        }`}
                      >
                        {trf.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {trf.status === 'DRAFT' && (
                        <button
                          onClick={() => {
                            advanceTransferStatus(trf.id, 'APPROVED');
                            notify(`Transfer ${trf.transferNumber} Approved! Ready for dispatch.`);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer"
                        >
                          Approve Transfer
                        </button>
                      )}

                      {trf.status === 'APPROVED' && (
                        <button
                          onClick={() => {
                            advanceTransferStatus(trf.id, 'IN_TRANSIT');
                            notify(`Transfer ${trf.transferNumber} Dispatched! Stock deducted from ${trf.sourceStoreName}.`);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md cursor-pointer"
                        >
                          Dispatch (In Transit)
                        </button>
                      )}

                      {(trf.status === 'IN_TRANSIT' || trf.status === 'DISPATCHED') && (
                        <button
                          onClick={() => {
                            advanceTransferStatus(trf.id, 'RECEIVED');
                            notify(`Transfer ${trf.transferNumber} Received at destination store!`);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md cursor-pointer"
                        >
                          Mark Received
                        </button>
                      )}

                      {trf.status === 'RECEIVED' && (
                        <button
                          onClick={() => {
                            advanceTransferStatus(trf.id, 'CONFIRMED');
                            notify(`Transfer ${trf.transferNumber} Confirmed! Stock credited to ${trf.destStoreName}.`);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
                        >
                          Confirm Final Receive
                        </button>
                      )}

                      {trf.status === 'CONFIRMED' && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Stock Credited
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Goods Intake Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl text-slate-100 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm sm:text-base">
                <Inbox className="w-5 h-5 shrink-0" />
                <span>Receive Goods / Production Intake</span>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGoodsIntakeSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Receiving Store</label>
                  <select
                    value={intakeStoreId}
                    onChange={(e) => setIntakeStoreId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none"
                    required
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Product SKU</label>
                  <select
                    value={intakeProductId}
                    onChange={(e) => {
                      setIntakeProductId(e.target.value);
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) setIntakeUnitCost(prod.costPriceUgx);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={intakeQty}
                    onChange={(e) => setIntakeQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Unit Cost Price (UGX)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={intakeUnitCost}
                    onChange={(e) => setIntakeUnitCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Production Batch Reference #</label>
                <input
                  type="text"
                  required
                  value={intakeBatchRef}
                  onChange={(e) => setIntakeBatchRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Intake Notes</label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  Record Goods Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Draft Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl text-slate-100 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm sm:text-base">
                <ArrowRightLeft className="w-5 h-5 shrink-0" />
                <span>Create Draft Branch Stock Transfer</span>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransferSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Source Store (From)</label>
                  <select
                    value={transferSourceStoreId}
                    onChange={(e) => setTransferSourceStoreId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none"
                    required
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Destination Store (To)</label>
                  <select
                    value={transferDestStoreId}
                    onChange={(e) => setTransferDestStoreId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none"
                    required
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Product</label>
                  <select
                    value={transferProductId}
                    onChange={(e) => setTransferProductId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Transfer Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-cyan-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">
                    Avail in source: {inventoryStock[transferSourceStoreId]?.[transferProductId] || 0} units
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Transport Delivery Vehicle</label>
                <select
                  value={transferVehicleName}
                  onChange={(e) => setTransferVehicleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={`${v.model} (${v.registrationNumber})`}>
                      {v.model} ({v.registrationNumber}) - {v.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-950 cursor-pointer"
                >
                  Create & Save Draft Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Level Adjustment Modal */}
      {isAdjustModalOpen && canAdjustStock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-cyan-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                    Update Stock Quantity
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Correct stock counts for products in the selected store.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-3.5 text-xs">
              {/* Store Selector */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Store / Warehouse</label>
                <select
                  value={adjustStoreId}
                  onChange={(e) => {
                    const newStore = e.target.value;
                    setAdjustStoreId(newStore);
                    setAdjustNewQty(inventoryStock[newStore]?.[adjustProductId] || 0);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                  required
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Product</label>
                <select
                  value={adjustProductId}
                  onChange={(e) => {
                    const newProd = e.target.value;
                    setAdjustProductId(newProd);
                    setAdjustNewQty(inventoryStock[adjustStoreId]?.[newProd] || 0);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) • {p.unitOfMeasure}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comparison Grid: Current Stock vs New Stock Level */}
              {(() => {
                const currentRecordedQty = inventoryStock[adjustStoreId]?.[adjustProductId] || 0;
                const delta = (Number(adjustNewQty) || 0) - currentRecordedQty;

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Current Stock in Store</div>
                        <div className="text-lg sm:text-xl font-extrabold font-mono text-slate-200 mt-0.5">
                          {currentRecordedQty.toLocaleString()}{' '}
                          <span className="text-xs text-slate-400 font-normal">units</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-cyan-400 font-bold uppercase mb-0.5">
                          New Correct Quantity *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={adjustNewQty}
                          onChange={(e) => setAdjustNewQty(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono font-extrabold text-base focus:outline-none focus:border-cyan-500"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Calculated Change Badge */}
                    <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-300">
                      <div className="font-semibold flex items-center gap-1.5 text-slate-400">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Quantity Change:</span>
                      </div>
                      <div className="font-mono font-extrabold text-sm text-cyan-300">
                        {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} units
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Adjustment Reason */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Reason for Change *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="Correction of entry mistake">Correction of entry mistake</option>
                  <option value="Physical stock count difference">Physical stock count difference</option>
                  <option value="Damaged or expired stock">Damaged or expired stock</option>
                  <option value="Routine stock reconciliation">Routine stock reconciliation</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Additional Notes <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Corrected quantity after counting warehouse items."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-950 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Stock Quantity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
