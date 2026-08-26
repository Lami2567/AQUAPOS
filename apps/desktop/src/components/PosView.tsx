import React, { useState } from 'react';
import { useStore, SaleRecord } from '../store/useStore';
import { calculateSaleSummary } from '@water-business/calculations';
import { PaymentMethod } from '@water-business/shared-types';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Printer,
  CreditCard,
  Phone,
  User,
  Tag,
  ShoppingBag,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const PosView: React.FC = () => {
  const {
    branches,
    currentBranchId,
    currentStoreId,
    stores,
    products,
    branchPrices,
    inventoryStock,
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    updateCartDiscount,
    overallDiscountUgx,
    setOverallDiscount,
    selectedPaymentMethod,
    setPaymentMethod,
    clearCart,
    addSaleRecord,
  } = useStore();

  const currentStore = stores.find((s) => s.id === currentStoreId);
  const currentBranch = branches.find((b) => b.id === currentBranchId || b.id === currentStore?.branchId);

  const getEffectivePrice = (prod: any) => {
    const bp = branchPrices.find(
      (p) => p.branchId === (currentBranch?.id || currentBranchId) && p.productId === prod.id
    );
    return bp?.sellingPriceUgx || prod.sellingPriceUgx;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPinModalOpen, setDiscountPinModalOpen] = useState(false);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [pendingDiscountAmount, setPendingDiscountAmount] = useState(0);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  // Keyboard Shortcuts (F2: Focus Search, F4: Checkout, ESC: Clear)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('pos-search-input')?.focus();
      } else if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        handleCompleteSale();
      } else if (e.key === 'Escape') {
        clearCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedPaymentMethod, paidAmountInput]);

  const handleApplyDiscountWithAuth = () => {
    if (managerPinInput === '1234' || managerPinInput === '8888') {
      setOverallDiscount(pendingDiscountAmount);
      setDiscountPinModalOpen(false);
      setManagerPinInput('');
    } else {
      alert('Invalid Manager Authorization PIN! Discount rejected.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate cart summary
  const summary = calculateSaleSummary({
    items: cart.map((c) => ({
      quantity: c.quantity,
      unitPriceUgx: c.unitPriceUgx,
      discountUgx: c.discountUgx,
    })),
    overallDiscountUgx,
    paidAmountUgx: Number(paidAmountInput) || 0,
  });

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;
    const store = stores.find((s) => s.id === currentStoreId);

    const saleRecord: SaleRecord = {
      id: uuidv4(),
      receiptNumber,
      storeId: currentStoreId,
      items: [...cart],
      subtotalUgx: summary.grossTotalUgx,
      overallDiscountUgx,
      totalAmountUgx: summary.netAmountUgx,
      paymentMethod: selectedPaymentMethod,
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    addSaleRecord(saleRecord);

    const receipt = {
      receiptNumber,
      timestamp: new Date().toLocaleString(),
      store: store?.name || 'Water Store',
      cashier: 'System Administrator',
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      items: [...cart],
      summary,
      paymentMethod: selectedPaymentMethod,
    };

    setCompletedReceipt(receipt);
    clearCart();
    setCustomerName('');
    setCustomerPhone('');
    setPaidAmountInput('');
    setMobileTab('catalog');
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 select-none pb-20 lg:pb-6">
      
      {/* Mobile / Tablet View Switcher (< lg) */}
      <div className="lg:hidden flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-md">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobileTab === 'catalog'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Product Catalog ({filteredProducts.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobileTab === 'cart'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Cart Order</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${mobileTab === 'cart' ? 'bg-cyan-800 text-white' : 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'}`}>
            {cart.length}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Product Catalog Column (Visible on desktop or when mobileTab === 'catalog') */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="pos-search-input"
                type="text"
                placeholder="Search SKU or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto py-1">
              {['ALL', 'BOTTLED_WATER', 'REFILL_JERRICAN', 'DISPENSER_ACCESSORIES'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat === 'ALL' ? 'All' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const stock = inventoryStock[currentStoreId]?.[product.id] || 0;
              const isOutOfStock = stock <= 0;
              const unitPrice = getEffectivePrice(product);

              return (
                <div
                  key={product.id}
                  onClick={() =>
                    !isOutOfStock &&
                    addToCart({
                      id: product.id,
                      sku: product.sku,
                      name: product.name,
                      sellingPriceUgx: unitPrice,
                    })
                  }
                  className={`glass-card rounded-2xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col justify-between group border border-slate-800 ${
                    isOutOfStock
                      ? 'opacity-60 cursor-not-allowed bg-slate-950/60'
                      : 'cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/80 active:scale-[0.99]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30 font-mono">
                        {product.sku}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-md border font-mono ${
                          isOutOfStock
                            ? 'text-rose-400 bg-rose-950/60 border-rose-500/30'
                            : stock <= product.minStockAlert
                            ? 'text-amber-400 bg-amber-950/60 border-amber-500/30'
                            : 'text-emerald-400 bg-emerald-950/60 border-emerald-500/20'
                        }`}
                      >
                        Stock: {stock.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{product.unitOfMeasure}</p>
                  </div>

                  <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-slate-800/80 pt-2.5 sm:pt-3">
                    <div>
                      <div className="text-[10px] text-slate-400">Unit Price</div>
                      <div className="text-base sm:text-lg font-extrabold text-cyan-400 font-mono">
                        UGX {unitPrice.toLocaleString()}
                      </div>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      className={`btn-touch p-2 sm:p-2.5 rounded-xl font-bold flex items-center gap-1 text-xs cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-600 group-hover:bg-cyan-500 text-white shadow-md'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart & Checkout Panel (Visible on desktop or when mobileTab === 'cart') */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'catalog' ? 'hidden lg:block' : 'block'}`}>
          <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between min-h-[500px] lg:min-h-[580px] shadow-2xl">
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-extrabold text-slate-100 text-base">Current Cart Order</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    {cart.length} item(s)
                  </span>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-slate-100 text-xs line-clamp-1">{item.name}</div>
                      <div className="text-[11px] text-cyan-400 font-mono">
                        UGX {item.unitPriceUgx.toLocaleString()} x {item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                        className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-xs px-1.5 text-slate-100 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                        className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-rose-400 hover:text-rose-300 ml-1 cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="text-center py-8 sm:py-12 text-slate-500 text-xs space-y-1">
                    <ShoppingBag className="w-7 h-7 mx-auto text-slate-600" />
                    <p>Cart is empty. Click a product to add it.</p>
                  </div>
                )}
              </div>

              {/* Customer Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+256 700..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER'] as PaymentMethod[]).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-2 px-1 rounded-xl font-bold border transition-all text-center text-[10px] cursor-pointer ${
                        selectedPaymentMethod === pm
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pm.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Totals & Button */}
            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs mt-3">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono">UGX {summary.grossTotalUgx.toLocaleString()}</span>
              </div>
              {overallDiscountUgx > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Discount:</span>
                  <span className="font-mono">- UGX {overallDiscountUgx.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-100 font-extrabold text-sm sm:text-base border-t border-slate-800 pt-1">
                <span>Total Payable:</span>
                <span className="text-cyan-400 font-mono">UGX {summary.netAmountUgx.toLocaleString()}</span>
              </div>

              <button
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className={`w-full py-3 sm:py-3.5 rounded-2xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  cart.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-cyan-950 active:scale-[0.99]'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete Sale & Print Receipt</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Floating Bottom Cart Bar on Mobile when on Catalog tab and Cart has items */}
      {mobileTab === 'catalog' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold">{cart.length} item(s) in cart</div>
            <div className="text-sm font-extrabold text-cyan-400 font-mono">
              UGX {summary.netAmountUgx.toLocaleString()}
            </div>
          </div>

          <button
            onClick={() => setMobileTab('cart')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Cart & Checkout</span>
          </button>
        </div>
      )}

      {/* Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-2xl text-slate-100 my-auto">
            <div className="text-center space-y-1 border-b border-slate-800 pb-3">
              <div className="font-extrabold text-cyan-400 text-base">AQUAPOS RECEIPT</div>
              <div className="text-xs text-slate-400 font-mono">{completedReceipt.receiptNumber}</div>
              <div className="text-[10px] text-slate-500">{completedReceipt.timestamp}</div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="border-b border-slate-800 pb-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                {completedReceipt.items.map((it: any) => (
                  <div key={it.productId} className="flex justify-between font-mono text-[11px]">
                    <span>{it.quantity}x {it.name}</span>
                    <span>UGX {(it.quantity * it.unitPriceUgx).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between font-extrabold text-emerald-400 pt-1">
                  <span>TOTAL PAID:</span>
                  <span>UGX {completedReceipt.summary.netAmountUgx.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Payment Method:</span>
                  <span>{completedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Customer:</span>
                  <span>{completedReceipt.customerName}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setCompletedReceipt(null)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Done / Print
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

