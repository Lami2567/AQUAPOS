import React, { useState } from 'react';
import { useStore, FieldSessionRecord, FieldSessionItem } from '../store/useStore';
import {
  calculateFieldStockReconciliation,
  calculateFieldMoneyReconciliation,
} from '@water-business/calculations';
import {
  Truck,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Clock,
  DollarSign,
  Package,
  XCircle,
  User,
  Store as StoreIcon,
  ShieldAlert,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const FieldSalesView: React.FC = () => {
  const {
    currentBranchId,
    currentStoreId,
    branches,
    vehicles,
    workers,
    stores,
    products,
    inventoryStock,
    fieldSessionsList,
    startFieldSession,
    closeFieldSession,
  } = useStore();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [activeReconcileSession, setActiveReconcileSession] = useState<FieldSessionRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const branchVehicles = vehicles.filter((v) => !currentBranchId || v.branchId === currentBranchId);
  const branchWorkers = workers.filter((w) => !currentBranchId || w.branchId === currentBranchId);
  const branchStores = stores.filter((s) => !currentBranchId || s.branchId === currentBranchId);
  const branchStoreIdSet = new Set(branchStores.map((s) => s.id));
  const visibleSessions = fieldSessionsList.filter(
    (fs) => branchStoreIdSet.size === 0 || branchStoreIdSet.has(fs.storeId)
  );

  // New Session Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState(branchVehicles[0]?.id || vehicles[0]?.id || '');
  const [selectedWorkerId, setSelectedWorkerId] = useState(branchWorkers[0]?.id || workers[0]?.id || '');
  const [selectedStoreId, setSelectedStoreId] = useState(currentStoreId || branchStores[0]?.id || stores[0]?.id || '');
  const [issuedQuantities, setIssuedQuantities] = useState<Record<string, number>>({});

  // Reconcile Form State
  const [itemReconcileInputs, setItemReconcileInputs] = useState<
    Record<string, { sold: number; returned: number; damaged: number; missing: number }>
  >({});
  const [cashCollected, setCashCollected] = useState(0);
  const [mobileMoney, setMobileMoney] = useState(0);
  const [bankDeposit, setBankDeposit] = useState(0);
  const [approvedExpenses, setApprovedExpenses] = useState(0);
  const [cashRemaining, setCashRemaining] = useState(0);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenStartModal = () => {
    const initialQtys: Record<string, number> = {};
    products.forEach((p) => {
      initialQtys[p.id] = 0;
    });
    setIssuedQuantities(initialQtys);
    setIsStartModalOpen(true);
  };

  const handleStartSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
    const worker = workers.find((w) => w.id === selectedWorkerId) || workers[0];

    const sessionItems: FieldSessionItem[] = [];
    Object.entries(issuedQuantities).forEach(([prodId, qty]) => {
      if (qty > 0) {
        const prod = products.find((p) => p.id === prodId);
        if (prod) {
          sessionItems.push({
            productId: prod.id,
            name: prod.name,
            issuedQty: qty,
            unitPriceUgx: prod.sellingPriceUgx,
          });
        }
      }
    });

    if (sessionItems.length === 0) {
      alert('Please issue at least 1 product quantity to start a route session.');
      return;
    }

    const sessionNumber = `FS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newSession: FieldSessionRecord = {
      id: uuidv4(),
      sessionNumber,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.model} (${vehicle.registrationNumber})`,
      workerId: worker.id,
      workerName: worker.fullName,
      storeId: selectedStoreId,
      status: 'OPEN',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: sessionItems,
    };

    startFieldSession(newSession);
    setIsStartModalOpen(false);
    notify(`Field Session ${sessionNumber} started successfully! Stock issued to ${vehicle.registrationNumber}.`);
  };

  const handleOpenReconcileModal = (session: FieldSessionRecord) => {
    setActiveReconcileSession(session);

    // Initialize item reconciliation state
    const initialInputs: Record<string, { sold: number; returned: number; damaged: number; missing: number }> = {};
    let totalExpected = 0;
    session.items.forEach((item) => {
      // Default: 80% sold, 20% returned as starting helper inputs
      const defaultSold = Math.floor(item.issuedQty * 0.8);
      const defaultReturned = item.issuedQty - defaultSold;
      initialInputs[item.productId] = {
        sold: defaultSold,
        returned: defaultReturned,
        damaged: 0,
        missing: 0,
      };
      totalExpected += defaultSold * item.unitPriceUgx;
    });

    setItemReconcileInputs(initialInputs);
    setCashCollected(Math.floor(totalExpected * 0.7));
    setMobileMoney(Math.floor(totalExpected * 0.3));
    setBankDeposit(0);
    setApprovedExpenses(0);
    setCashRemaining(0);
  };

  // Calculate live expected sales money
  const calculateTotalExpectedMoney = () => {
    if (!activeReconcileSession) return 0;
    let sum = 0;
    activeReconcileSession.items.forEach((item) => {
      const inputs = itemReconcileInputs[item.productId] || { sold: 0 };
      sum += (Number(inputs.sold) || 0) * item.unitPriceUgx;
    });
    return sum;
  };

  const expectedSalesTotalUgx = calculateTotalExpectedMoney();

  const moneyRes = calculateFieldMoneyReconciliation({
    expectedSalesUgx: expectedSalesTotalUgx,
    cashCollectedUgx: Number(cashCollected) || 0,
    mobileMoneyUgx: Number(mobileMoney) || 0,
    bankDepositUgx: Number(bankDeposit) || 0,
    approvedExpensesUgx: Number(approvedExpenses) || 0,
    cashRemainingUgx: Number(cashRemaining) || 0,
  });

  const handleConfirmReconciliation = () => {
    if (!activeReconcileSession) return;

    const reconciledItems: FieldSessionItem[] = activeReconcileSession.items.map((item) => {
      const inputs = itemReconcileInputs[item.productId] || { sold: 0, returned: 0, damaged: 0, missing: 0 };
      return {
        ...item,
        soldQty: Number(inputs.sold) || 0,
        returnedQty: Number(inputs.returned) || 0,
        damagedQty: Number(inputs.damaged) || 0,
        missingQty: Number(inputs.missing) || 0,
      };
    });

    closeFieldSession(activeReconcileSession.id, reconciledItems, moneyRes.moneyVarianceUgx);
    const closedSessionNumber = activeReconcileSession.sessionNumber;
    setActiveReconcileSession(null);

    if (moneyRes.moneyVarianceUgx < 0) {
      notify(`Session ${closedSessionNumber} reconciled with shortage! Worker debt recorded for UGX ${Math.abs(moneyRes.moneyVarianceUgx).toLocaleString()}.`);
    } else {
      notify(`Session ${closedSessionNumber} closed & reconciled successfully! All funds and stock accounted for.`);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 shrink-0" />
            <span>Field Sales & Worker Sessions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track lorry & tricycle field deliveries, stock issues, returns, and dual stock/money reconciliations.
          </p>
        </div>

        <button
          onClick={handleOpenStartModal}
          className="btn-touch bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40 font-bold text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Start New Field Session
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Active Field Sessions Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 sm:space-y-4">
        <h3 className="font-bold text-slate-200 text-sm">
          Active & Recent Field Sessions ({visibleSessions.length})
        </h3>
        
        {visibleSessions.length === 0 ? (
          <div className="text-center py-10 sm:py-12 text-slate-500 text-xs space-y-2">
            <Truck className="w-8 h-8 mx-auto text-slate-600" />
            <p>No field sessions found for current branch. Click "Start New Field Session" to dispatch a delivery vehicle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Session #</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Lead Worker</th>
                  <th className="p-3">Issued Items</th>
                  <th className="p-3">Start Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-cyan-400 font-mono">{session.sessionNumber}</td>
                    <td className="p-3 font-semibold text-slate-200">{session.vehicleName}</td>
                    <td className="p-3">{session.workerName}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {session.items.map((it, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">
                            {it.issuedQty}x {it.name.split(' ')[2] || it.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-slate-400">{session.startTime}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          session.status === 'OPEN'
                            ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                            : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {session.status === 'OPEN' ? (
                        <button
                          onClick={() => handleOpenReconcileModal(session)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Close & Reconcile
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-semibold whitespace-nowrap">Reconciled ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Start New Field Session Modal */}
      {isStartModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm sm:text-base">
                <Truck className="w-5 h-5" />
                <span>Start New Route Field Session</span>
              </div>
              <button
                onClick={() => setIsStartModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartSessionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Delivery Vehicle</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none"
                    required
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model} ({v.registrationNumber}) - {v.type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Lead Salesperson / Driver</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none"
                    required
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.fullName} ({w.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Dispatching Source Store</label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
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

              {/* Product Quantity Issuance Inputs */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <label className="block text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                  Issue Stock Quantities to Vehicle:
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {products.map((prod) => {
                    const storeAvail = inventoryStock[selectedStoreId]?.[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-200 truncate">{prod.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            Avail: <span className="text-emerald-400 font-bold">{storeAvail}</span> • UGX {prod.sellingPriceUgx.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={storeAvail}
                            value={issuedQuantities[prod.id] || 0}
                            onChange={(e) =>
                              setIssuedQuantities({
                                ...issuedQuantities,
                                [prod.id]: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-right font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                          />
                          <span className="text-[10px] text-slate-400">units</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-900/40 cursor-pointer"
                >
                  Dispatch Vehicle & Start Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dual Reconcile Modal */}
      {activeReconcileSession && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl text-slate-100 my-auto max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-cyan-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 shrink-0" /> Field Session Reconciliation: {activeReconcileSession.sessionNumber}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Vehicle: <span className="text-slate-200 font-bold">{activeReconcileSession.vehicleName}</span> • Salesperson: <span className="text-slate-200 font-bold">{activeReconcileSession.workerName}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveReconcileSession(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Stock Item Balancing Inputs */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>1. Stock Equation Reconciliation (Issued = Sold + Returned + Damaged + Missing)</span>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {activeReconcileSession.items.map((item) => {
                  const inputs = itemReconcileInputs[item.productId] || { sold: 0, returned: 0, damaged: 0, missing: 0 };
                  const stockEq = calculateFieldStockReconciliation({
                    issuedQty: item.issuedQty,
                    soldQty: Number(inputs.sold) || 0,
                    returnedQty: Number(inputs.returned) || 0,
                    damagedQty: Number(inputs.damaged) || 0,
                    missingQty: Number(inputs.missing) || 0,
                  });

                  return (
                    <div key={item.productId} className="bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="font-bold text-slate-100">{item.name}</span>
                        <span className="font-mono text-cyan-400 font-bold">Issued: {item.issuedQty} units @ UGX {item.unitPriceUgx.toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-emerald-400 font-semibold mb-1">Sold Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={inputs.sold}
                            onChange={(e) =>
                              setItemReconcileInputs({
                                ...itemReconcileInputs,
                                [item.productId]: { ...inputs, sold: parseInt(e.target.value) || 0 },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-emerald-300 font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-blue-400 font-semibold mb-1">Returned Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={inputs.returned}
                            onChange={(e) =>
                              setItemReconcileInputs({
                                ...itemReconcileInputs,
                                [item.productId]: { ...inputs, returned: parseInt(e.target.value) || 0 },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-blue-300 font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-amber-400 font-semibold mb-1">Damaged Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={inputs.damaged}
                            onChange={(e) =>
                              setItemReconcileInputs({
                                ...itemReconcileInputs,
                                [item.productId]: { ...inputs, damaged: parseInt(e.target.value) || 0 },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-amber-300 font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-rose-400 font-semibold mb-1">Missing Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={inputs.missing}
                            onChange={(e) =>
                              setItemReconcileInputs({
                                ...itemReconcileInputs,
                                [item.productId]: { ...inputs, missing: parseInt(e.target.value) || 0 },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-rose-300 font-bold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] pt-1">
                        <span className={stockEq.isValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          Equation Status: {stockEq.isValid ? 'Stock Balanced ✓' : `Variance: ${stockEq.varianceQty} units`}
                        </span>
                        <span className="text-slate-400 font-mono">
                          Expected Sales Revenue: UGX {((Number(inputs.sold) || 0) * item.unitPriceUgx).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Money Collection Reconciliation */}
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>2. Money Accounting (Expected = Cash + Mobile + Bank + Expenses + Remaining)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Physical Cash (UGX)</label>
                  <input
                    type="number"
                    value={cashCollected}
                    onChange={(e) => setCashCollected(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-slate-100 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Mobile Money (UGX)</label>
                  <input
                    type="number"
                    value={mobileMoney}
                    onChange={(e) => setMobileMoney(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-slate-100 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Bank Deposit (UGX)</label>
                  <input
                    type="number"
                    value={bankDeposit}
                    onChange={(e) => setBankDeposit(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-slate-100 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Route Expenses (UGX)</label>
                  <input
                    type="number"
                    value={approvedExpenses}
                    onChange={(e) => setApprovedExpenses(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-slate-100 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Remaining Float (UGX)</label>
                  <input
                    type="number"
                    value={cashRemaining}
                    onChange={(e) => setCashRemaining(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-slate-100 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time money reconciliation verdict */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${
                  moneyRes.moneyVarianceUgx < 0
                    ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                    : moneyRes.moneyVarianceUgx > 0
                    ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div>
                  <div>Accounted Total: <span className="font-bold font-mono">UGX {moneyRes.totalAccountedUgx.toLocaleString()}</span></div>
                  <div className="text-[11px] opacity-80 mt-0.5 font-mono">
                    Expected Sales: UGX {moneyRes.expectedSalesUgx.toLocaleString()}
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-sm font-extrabold">{moneyRes.formattedMessage}</div>
                  {moneyRes.moneyVarianceUgx < 0 && (
                    <div className="text-[10px] opacity-90 mt-0.5 font-bold">
                      Shortage will automatically create an outstanding worker debt record for payroll recovery.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={handleConfirmReconciliation}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> Confirm & Authorize Reconciliation
              </button>
              <button
                onClick={() => setActiveReconcileSession(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
