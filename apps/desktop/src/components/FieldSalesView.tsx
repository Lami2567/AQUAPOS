import React, { useState, useEffect } from 'react';
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
    user,
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
  const [selectedVehicleId, setSelectedVehicleId] = useState(branchVehicles[0]?.id || vehicles[0]?.id || 'default-van');
  const [selectedWorkerId, setSelectedWorkerId] = useState('self');
  const [selectedStoreId, setSelectedStoreId] = useState(currentStoreId || branchStores[0]?.id || stores[0]?.id || '');
  const [issuedQuantities, setIssuedQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(currentStoreId || branchStores[0]?.id || stores[0]?.id || '');
    }
  }, [stores, currentStoreId, branchStores, selectedStoreId]);

  // Reconcile Form State
  const [selectedReturnStoreId, setSelectedReturnStoreId] = useState<string>('');
  const [itemReconcileInputs, setItemReconcileInputs] = useState<
    Record<string, { sold: number; returned: number; damaged: number; missing: number }>
  >({});
  const [cashCollected, setCashCollected] = useState(0);
  const [mobileMoney, setMobileMoney] = useState(0);
  const [bankDeposit, setBankDeposit] = useState(0);
  const [approvedExpenses, setApprovedExpenses] = useState(0);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [cashRemaining, setCashRemaining] = useState(0);

  // Expense Description Popup Modal State
  const [selectedExpensePopup, setSelectedExpensePopup] = useState<{
    title: string;
    subtitle?: string;
    amountUgx: number;
    description: string;
    author?: string;
    date?: string;
  } | null>(null);

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
    if (!selectedStoreId) {
      setSelectedStoreId(currentStoreId || branchStores[0]?.id || stores[0]?.id || '');
    }
    setIsStartModalOpen(true);
  };

  const handleStartSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || {
      id: uuidv4(),
      model: 'Field Route Vehicle',
      registrationNumber: 'DIRECT-SALES',
      type: 'LORRY',
    };

    let workerId = selectedWorkerId;
    let workerName = user?.fullName || user?.username || 'Field Salesperson';

    if (selectedWorkerId && selectedWorkerId !== 'self') {
      const foundWorker = workers.find((w) => w.id === selectedWorkerId);
      if (foundWorker) {
        workerId = foundWorker.id;
        workerName = foundWorker.fullName;
      }
    } else {
      const matchingWorker = workers.find((w) => w.fullName.toLowerCase() === (user?.fullName || '').toLowerCase());
      workerId = matchingWorker ? matchingWorker.id : (workers[0]?.id || uuidv4());
    }

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

    const storeId = selectedStoreId || currentStoreId || branchStores[0]?.id || stores[0]?.id || 'main-store';

    // Verify stock availability
    for (const item of sessionItems) {
      const avail = inventoryStock[storeId]?.[item.productId] || 0;
      if (item.issuedQty > avail) {
        alert(`Insufficient store stock for ${item.name}! Available: ${avail}, Requested: ${item.issuedQty}`);
        return;
      }
    }

    const sessionNumber = `FS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newSession: FieldSessionRecord = {
      id: uuidv4(),
      sessionNumber,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.model} (${vehicle.registrationNumber})`,
      workerId,
      workerName,
      storeId,
      status: 'OPEN',
      startTime: new Date().toISOString(),
      items: sessionItems,
    };

    startFieldSession(newSession);
    setIsStartModalOpen(false);
    notify(`Field Session ${sessionNumber} started successfully! Stock issued to ${vehicle.registrationNumber}.`);
  };

  const handleOpenReconcileModal = (session: FieldSessionRecord) => {
    setActiveReconcileSession(session);
    setSelectedReturnStoreId(session.returnStoreId || session.storeId || currentStoreId || stores[0]?.id || '');

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
    setExpenseDescription('');
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

    const targetReturnStoreId = selectedReturnStoreId || activeReconcileSession.returnStoreId || activeReconcileSession.storeId;

    closeFieldSession(
      activeReconcileSession.id,
      reconciledItems,
      moneyRes.moneyVarianceUgx,
      {
        expectedSalesUgx: moneyRes.expectedSalesUgx,
        cashCollectedUgx: Number(cashCollected) || 0,
        mobileMoneyUgx: Number(mobileMoney) || 0,
        bankDepositUgx: Number(bankDeposit) || 0,
        approvedExpensesUgx: Number(approvedExpenses) || 0,
        cashRemainingUgx: Number(cashRemaining) || 0,
        expenseDescription: expenseDescription.trim(),
        returnStoreId: targetReturnStoreId,
      },
      targetReturnStoreId
    );

    const closedSessionNumber = activeReconcileSession.sessionNumber;
    setActiveReconcileSession(null);

    if (moneyRes.moneyVarianceUgx < 0) {
      notify(`Session ${closedSessionNumber} reconciled with shortage! Worker debt recorded for UGX ${Math.abs(moneyRes.moneyVarianceUgx).toLocaleString()}. Revenue updated.`);
    } else {
      notify(`Session ${closedSessionNumber} closed & reconciled successfully! Revenue and stock recorded in system.`);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-white shrink-0" />
            <span>Field Sales & Worker Sessions</span>
          </h1>
          <p className="text-xs text-white/80 mt-1">
            Track lorry & tricycle field deliveries, stock issues, returns, and dual stock/money reconciliations.
          </p>
        </div>

        <button
          onClick={handleOpenStartModal}
          className="btn-touch bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold hover:bg-white/25 text-white shadow-lg shadow-cyan-900/40 font-bold text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Start New Field Session
        </button>
      </div>

      {notification && (
        <div className="bg-[#0F1B3E] border border-white/20 text-white/80 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 text-white shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Active Field Sessions Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/15 space-y-3 sm:space-y-4">
        <h3 className="font-bold text-white text-sm">
          Active & Recent Field Sessions ({visibleSessions.length})
        </h3>
        
        {visibleSessions.length === 0 ? (
          <div className="text-center py-10 sm:py-12 text-white/70 text-xs space-y-2">
            <Truck className="w-8 h-8 mx-auto text-white/70" />
            <p>No field sessions found for current branch. Click "Start New Field Session" to dispatch a delivery vehicle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/15/80">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#070E24] text-white/80 font-bold uppercase tracking-wider border-b border-white/15">
                <tr>
                  <th className="p-3">Session #</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Lead Worker</th>
                  <th className="p-3">Issued Items</th>
                  <th className="p-3">Route Expenses</th>
                  <th className="p-3">Start Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleSessions.map((session) => {
                  const dispatchStore = stores.find((s) => s.id === session.storeId);
                  const returnStore = session.returnStoreId ? stores.find((s) => s.id === session.returnStoreId) : null;
                  return (
                    <tr key={session.id} className="hover:bg-[#0F1B3E]/50">
                      <td className="p-3">
                        <div className="font-bold text-white font-mono">{session.sessionNumber}</div>
                        <div className="text-[10px] text-white/80 mt-0.5">
                          <span>Store: </span>
                          <span className="text-white font-semibold">{dispatchStore ? `${dispatchStore.name} (${dispatchStore.code})` : session.storeId}</span>
                          {session.returnStoreId && session.returnStoreId !== session.storeId && (
                            <span className="text-white font-semibold block">
                              ↳ Ret: {returnStore ? `${returnStore.name} (${returnStore.code})` : session.returnStoreName || session.returnStoreId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-white">{session.vehicleName}</td>
                      <td className="p-3">{session.workerName}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {session.items.map((it, idx) => (
                          <span key={idx} className="bg-[#182855] text-white px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">
                            {it.issuedQty}x {it.name.split(' ')[2] || it.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {(session.approvedExpensesUgx && session.approvedExpensesUgx > 0) || session.expenseDescription ? (
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-white text-xs">
                            UGX {(session.approvedExpensesUgx || 0).toLocaleString()}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedExpensePopup({
                                title: `Route Expenses - ${session.sessionNumber}`,
                                subtitle: `${session.vehicleName} • ${session.workerName}`,
                                amountUgx: session.approvedExpensesUgx || 0,
                                description: session.expenseDescription || 'No detailed description provided.',
                                author: session.workerName,
                                date: session.endTime ? session.endTime.split('T')[0] : session.startTime,
                              })
                            }
                            className="text-left text-white hover:text-white/90 text-[11px] underline underline-offset-2 max-w-[130px] truncate block cursor-pointer transition-colors"
                            title="Click to view full description"
                          >
                            {session.expenseDescription || 'View Description'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">-</span>
                      )}
                    </td>
                    <td className="p-3 text-white/80 font-mono">
                      {session.startTime && session.startTime.includes('T')
                        ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : session.startTime || '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          session.status === 'OPEN'
                            ? 'bg-[#0F1B3E]/90 border-white/20 text-white/90'
                            : 'bg-[#0F1B3E]/90 border-white/20 text-white'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {session.status === 'OPEN' ? (
                        <button
                          onClick={() => handleOpenReconcileModal(session)}
                          className="bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold hover:bg-white/25 text-white px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-cyan-950 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Close & Reconcile
                        </button>
                      ) : (
                        <span className="text-white/70 text-[11px] font-semibold whitespace-nowrap">Reconciled ✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Start New Field Session Modal */}
      {isStartModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-[#0F1B3E] border border-white/15 rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
                <Truck className="w-5 h-5" />
                <span>Start New Route Field Session</span>
              </div>
              <button
                onClick={() => setIsStartModalOpen(false)}
                className="text-white/80 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartSessionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-white/80 mb-1 font-semibold">Delivery Vehicle</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-[#070E24] border border-white/15 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
                  >
                    {vehicles.length === 0 ? (
                      <option value="default-van">Direct Route Vehicle (Default Van / Tricycle)</option>
                    ) : (
                      vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.model} ({v.registrationNumber}) - {v.type}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-1 font-semibold">Lead Salesperson & Driver</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full bg-[#070E24] border border-white/15 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
                  >
                    <option value="self">
                      {user?.fullName || user?.username || 'Current User'} (Self - Salesperson & Driver)
                    </option>
                    {branchWorkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.fullName} ({w.role || w.department})
                      </option>
                    ))}
                    {branchWorkers.length === 0 && workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.fullName} ({w.role || w.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/80 mb-1 font-semibold">Dispatching Source Store</label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full bg-[#070E24] border border-white/15 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
                >
                  {stores.length === 0 ? (
                    <option value="main-store">Main Store</option>
                  ) : (
                    stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Product Quantity Issuance Inputs */}
              <div className="space-y-2 border-t border-white/15 pt-3">
                <label className="block text-white font-bold uppercase tracking-wider text-[11px]">
                  Issue Stock Quantities to Vehicle:
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {products.map((prod) => {
                    const storeAvail = inventoryStock[selectedStoreId]?.[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2.5 bg-[#070E24]/70 border border-white/15/80 rounded-xl gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate">{prod.name}</div>
                          <div className="text-[10px] text-white/80 font-mono truncate">
                            Avail: <span className="text-white font-bold">{storeAvail}</span> • UGX {prod.sellingPriceUgx.toLocaleString()}
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
                            className="w-20 bg-[#0F1B3E] border border-white/20 rounded-lg px-2 py-1.5 text-right font-mono font-bold text-white/90 focus:outline-none focus:border-white/30"
                          />
                          <span className="text-[10px] text-white/80">units</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 border-t border-white/15 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="px-4 py-2.5 bg-[#182855] hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold hover:bg-white/25 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-900/40 cursor-pointer"
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
        <div className="fixed inset-0 bg-[#070E24]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-[#0F1B3E] border border-white/15 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl text-white my-auto max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/15 pb-3 sm:pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 shrink-0" /> Field Session Reconciliation: {activeReconcileSession.sessionNumber}
                </h2>
                <div className="text-xs text-white/80 mt-0.5">
                  Vehicle: <span className="text-white font-bold">{activeReconcileSession.vehicleName}</span> • Salesperson: <span className="text-white font-bold">{activeReconcileSession.workerName}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveReconcileSession(null)}
                className="text-white/80 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Return Destination Store Selection */}
            <div className="bg-[#070E24] border border-white/15 p-3 sm:p-4 rounded-2xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <StoreIcon className="w-4 h-4 text-white shrink-0" />
                  <span>Return Destination Store (For Unsold Water)</span>
                </label>
                {selectedReturnStoreId && selectedReturnStoreId !== activeReconcileSession.storeId && (
                  <span className="text-[10px] text-white/90 font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/20 inline-flex items-center gap-1">
                    ✓ Returning stock to different store
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0F1B3E] border border-white/15 rounded-xl p-2.5 flex flex-col justify-center">
                  <span className="text-[10px] text-white/80 block uppercase font-bold">Dispatched From</span>
                  <span className="text-white font-semibold">
                    {stores.find((s) => s.id === activeReconcileSession.storeId)?.name || activeReconcileSession.storeId} ({stores.find((s) => s.id === activeReconcileSession.storeId)?.code || 'SRC'})
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] text-white/80 mb-1 font-semibold">Deliver / Offload Returns Into:</label>
                  <select
                    value={selectedReturnStoreId}
                    onChange={(e) => setSelectedReturnStoreId(e.target.value)}
                    className="w-full bg-[#0F1B3E] border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-white/25 cursor-pointer"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) {s.id === activeReconcileSession.storeId ? '— (Original Dispatch Store)' : '— (Alternative Return Store)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-white/80">
                You can return unsold bottles to <strong className="text-white">any store</strong>. Returned quantities will be immediately credited and added to the selected store's stock.
              </p>
            </div>

            {/* Step 1: Stock Item Balancing Inputs */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-white shrink-0" />
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
                    <div key={item.productId} className="bg-[#070E24] border border-white/15 p-3 sm:p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="font-mono text-white font-bold">Issued: {item.issuedQty} units @ UGX {item.unitPriceUgx.toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-white font-semibold mb-1">Sold Qty</label>
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
                            className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white font-semibold mb-1">Returned Qty</label>
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
                            className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white font-semibold mb-1">Damaged Qty</label>
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
                            className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white font-semibold mb-1">Missing Qty</label>
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
                            className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] pt-1">
                        <span className={stockEq.isValid ? 'text-white font-bold' : 'text-white/80 font-bold'}>
                          Equation Status: {stockEq.isValid ? 'Stock Balanced ✓' : `Variance: ${stockEq.varianceQty} units`}
                        </span>
                        <span className="text-white/80 font-mono">
                          Expected Sales Revenue: UGX {((Number(inputs.sold) || 0) * item.unitPriceUgx).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Money Collection Reconciliation */}
            <div className="space-y-3 border-t border-white/15 pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-white shrink-0" />
                <span>2. Money Accounting (Expected = Cash + Mobile + Bank + Expenses + Remaining)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-white/80 mb-1">Physical Cash (UGX)</label>
                  <input
                    type="number"
                    value={cashCollected}
                    onChange={(e) => setCashCollected(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-2 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/80 mb-1">Mobile Money (UGX)</label>
                  <input
                    type="number"
                    value={mobileMoney}
                    onChange={(e) => setMobileMoney(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-2 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/80 mb-1">Bank Deposit (UGX)</label>
                  <input
                    type="number"
                    value={bankDeposit}
                    onChange={(e) => setBankDeposit(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-2 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/80 mb-1">Route Expenses (UGX)</label>
                  <input
                    type="number"
                    value={approvedExpenses}
                    onChange={(e) => setApprovedExpenses(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-2 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/80 mb-1">Remaining Float (UGX)</label>
                  <input
                    type="number"
                    value={cashRemaining}
                    onChange={(e) => setCashRemaining(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-2 font-mono text-white font-bold focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {/* Route Expenses Description Section */}
              <div className="space-y-1.5 bg-[#070E24]/60 border border-white/15/80 rounded-xl p-3">
                <label className="block text-[11px] text-white font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-white" />
                    <span>Route Expenses Description & Justification</span>
                  </span>
                  {approvedExpenses > 0 && !expenseDescription.trim() && (
                    <span className="text-[10px] text-white font-normal">
                      Detail expenses incurred (e.g. Fuel, Puncture, Meals)
                    </span>
                  )}
                </label>
                <textarea
                  rows={2}
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Enter details of field route expenses (e.g., Vehicle fuel UGX 20,000, Tyre repair UGX 5,000, Driver & loader lunch UGX 10,000)..."
                  className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Real-time money reconciliation verdict */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${
                  moneyRes.moneyVarianceUgx < 0
                    ? 'bg-[#070E24]/90 border-white/20 text-white'
                    : moneyRes.moneyVarianceUgx > 0
                    ? 'bg-[#070E24]/90 border-white/20 text-white/80'
                    : 'bg-[#070E24]/90 border-white/20 text-white/90'
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
                    <div className="text-[10px] opacity-90 mt-0.5 font-bold text-white/80">
                      Shortage will automatically create an outstanding worker debt record for payroll recovery.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 border-t border-white/15 pt-4">
              <button
                onClick={handleConfirmReconciliation}
                className="flex-1 bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold hover:bg-white/25 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-white/80" /> Confirm & Authorize Reconciliation
              </button>
              <button
                onClick={() => setActiveReconcileSession(null)}
                className="bg-[#182855] hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Expense Description Details Popup Modal */}
      {selectedExpensePopup && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in"
          onClick={() => setSelectedExpensePopup(null)}
        >
          <div
            className="bg-[#0F1B3E] border border-white/15 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="space-y-0.5">
                <div className="text-white font-bold text-sm sm:text-base">
                  {selectedExpensePopup.title}
                </div>
                {selectedExpensePopup.subtitle && (
                  <div className="text-white/80 text-xs">
                    {selectedExpensePopup.subtitle}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedExpensePopup(null)}
                className="text-white/80 hover:text-white text-base font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#070E24] border border-white/15 rounded-xl p-3 flex justify-between items-center">
                <span className="text-white/80 font-semibold">Expense Amount:</span>
                <span className="font-mono font-bold text-white text-sm">
                  UGX {selectedExpensePopup.amountUgx.toLocaleString()}
                </span>
              </div>

              {(selectedExpensePopup.author || selectedExpensePopup.date) && (
                <div className="flex justify-between text-white/80 text-[11px] px-1">
                  {selectedExpensePopup.author && (
                    <span>
                      Worker: <span className="text-white font-medium">{selectedExpensePopup.author}</span>
                    </span>
                  )}
                  {selectedExpensePopup.date && (
                    <span>
                      Date: <span className="text-white font-medium">{selectedExpensePopup.date}</span>
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/80 font-semibold mb-1.5">
                  Full Expense Description:
                </label>
                <div className="bg-[#070E24] border border-white/15 rounded-xl p-3.5 text-white text-xs leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto font-normal">
                  {selectedExpensePopup.description}
                </div>
              </div>
            </div>

            <div className="border-t border-white/15 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedExpensePopup(null)}
                className="bg-[#182855] hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
