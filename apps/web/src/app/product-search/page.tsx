"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductData {
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: string;
  subcategory: string;
  weight: number | null;
  dimensions: { length: number; width: number; height: number } | null;
  images: string[];
  source: "wb" | "ozon";
  sourceUrl: string;
  productId: string;
  rating: number | null;
  reviewCount: number | null;
  quantity: number | null;
}

interface ChinaProduct {
  product_id: string;
  title: string;
  brand: string;
  price_range: string;
  min_price: number;
  max_price: number;
  price_tiers: { price: number; min_qty: number }[];
  unit_weight_kg: number | null;
  images: string[];
  sale_quantity: string;
  company_name: string;
  location: string;
  moq: number;
  attributes: Record<string, string>;
  detail_url: string;
}

interface ChinaSearchResult {
  searchMethod: "image" | "text";
  totalFound: number;
  products: ChinaProduct[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

function fmtCny(n: number): string {
  return `¥${n.toFixed(2)}`;
}

const CNY_TO_RUB = 12.5; // approximate rate

function cnyToRub(cny: number): number {
  return Math.round(cny * CNY_TO_RUB);
}

function detectPlatform(url: string): "wb" | "ozon" | null {
  if (url.includes("wildberries.ru")) return "wb";
  if (url.includes("ozon.ru")) return "ozon";
  return null;
}

/** Calculate volume of N items packed optimally, in m³ */
function calcTotalVolume(
  dims: { length: number; width: number; height: number } | null,
  qty: number
): number | null {
  if (!dims) return null;
  // dims are in cm → convert to m³
  const singleVolumeCm3 = dims.length * dims.width * dims.height;
  // For packing estimate: cube root stacking formula
  // Items along each axis ≈ cbrt(qty), then multiply dims
  const cbrt = Math.cbrt(qty);
  const totalL = dims.length * Math.ceil(cbrt);
  const totalW = dims.width * Math.ceil(cbrt);
  // Remaining items along height
  const remainingLayers = Math.ceil(qty / (Math.ceil(cbrt) * Math.ceil(cbrt)));
  const totalH = dims.height * remainingLayers;
  const packedVolumeCm3 = totalL * totalW * totalH;
  // Use simpler estimate: single volume * qty (no packing optimization needed for cost calc)
  const simpleVolumeCm3 = singleVolumeCm3 * qty;
  // Return the smaller of the two (packed is usually better)
  return Math.min(packedVolumeCm3, simpleVolumeCm3) / 1_000_000;
}

/** Get best price from tiers for given quantity */
function getBestPrice(tiers: { price: number; min_qty: number }[], qty: number): number {
  if (tiers.length === 0) return 0;
  // Sort by min_qty desc, find first tier where qty >= min_qty
  const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
  for (const tier of sorted) {
    if (qty >= tier.min_qty) return tier.price;
  }
  return tiers[0].price;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function LinkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.07a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function SpinnerIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step, loading }: { step: number; loading: boolean }) {
  const steps = [
    { num: 1, label: "Ссылка и количество" },
    { num: 2, label: "Данные товара" },
    { num: 3, label: "Поиск в Китае" },
    { num: 4, label: "Сравнение" },
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-1 sm:gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              step > s.num
                ? "bg-green-100 text-green-700"
                : step === s.num
                  ? loading
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {step > s.num ? (
              <CheckIcon className="w-3 h-3" />
            ) : (
              <span>{s.num}</span>
            )}
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-4 sm:w-8 h-0.5 ${step > s.num ? "bg-green-300" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Russia Product Card ─────────────────────────────────────────────────────

function RussiaProductCard({
  product,
  selectedImage,
  onSelectImage,
}: {
  product: ProductData;
  selectedImage: number;
  onSelectImage: (i: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Товар в России</h3>
        <span
          className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wide ${
            product.source === "wb"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {product.source === "wb" ? "Wildberries" : "Ozon"}
        </span>
      </div>
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-64 p-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-2">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3EФото%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {product.images.slice(0, 5).map((img, i) => (
                <button
                  key={i}
                  onClick={() => onSelectImage(i)}
                  className={`flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === selectedImage ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-5">
          {product.brand && (
            <span className="text-xs text-gray-400 font-medium">{product.brand}</span>
          )}
          <h4 className="text-base font-semibold text-gray-900 leading-tight mb-3">
            {product.name}
          </h4>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">{fmt(product.price)} ₽</span>
            {product.discount > 0 && (
              <>
                <span className="text-sm text-gray-400 line-through">{fmt(product.originalPrice)} ₽</span>
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-red-100 text-red-600 rounded">
                  -{product.discount}%
                </span>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {product.category && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-gray-400 text-xs">Категория</div>
                <div className="font-medium text-gray-700">{product.category}</div>
              </div>
            )}
            {product.subcategory && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-gray-400 text-xs">Подкатегория</div>
                <div className="font-medium text-gray-700">{product.subcategory}</div>
              </div>
            )}
            {product.weight != null && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-gray-400 text-xs">Вес</div>
                <div className="font-medium text-gray-700">
                  {product.weight >= 1000
                    ? `${(product.weight / 1000).toFixed(2)} кг`
                    : `${product.weight} г`}
                </div>
              </div>
            )}
            {product.dimensions && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-gray-400 text-xs">Габариты (см)</div>
                <div className="font-medium text-gray-700">
                  {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height}
                </div>
              </div>
            )}
            {product.rating != null && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-gray-400 text-xs">Рейтинг</div>
                <div className="font-medium text-gray-700">
                  {product.rating.toFixed(1)} ({fmt(product.reviewCount || 0)} отз.)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── China Product Cards ─────────────────────────────────────────────────────

function ChinaProductCards({
  products,
  selectedIndex,
  onSelect,
  qty,
}: {
  products: ChinaProduct[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
  qty: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Найдено на 1688</h3>
        <span className="text-xs text-gray-400">{products.length} товаров</span>
      </div>
      <div className="grid gap-3">
        {products.map((p, i) => {
          const bestPrice = getBestPrice(p.price_tiers, qty);
          const isSelected = selectedIndex === i;
          return (
            <button
              key={p.product_id}
              onClick={() => onSelect(i)}
              className={`text-left w-full bg-white rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? "border-red-500 shadow-md shadow-red-100"
                  : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <div className="flex gap-4">
                {p.images[0] && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{p.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-bold text-red-600">{fmtCny(bestPrice)}</span>
                    <span className="text-gray-400">≈ {fmt(cnyToRub(bestPrice))} ₽</span>
                    {p.unit_weight_kg != null && (
                      <span className="text-gray-400">{p.unit_weight_kg} кг</span>
                    )}
                    {p.sale_quantity && (
                      <span className="text-gray-400">Продано: {p.sale_quantity}</span>
                    )}
                  </div>
                  {p.price_tiers.length > 1 && (
                    <div className="flex gap-2 mt-1.5">
                      {p.price_tiers.map((t, ti) => (
                        <span
                          key={ti}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            qty >= t.min_qty &&
                            (ti === p.price_tiers.length - 1 || qty < p.price_tiers[ti + 1]?.min_qty)
                              ? "bg-red-100 text-red-700 font-medium"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          от {t.min_qty} шт: {fmtCny(t.price)}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.company_name && (
                    <p className="text-xs text-gray-400 mt-1">{p.company_name} · {p.location}</p>
                  )}
                </div>
                <div className="flex-shrink-0 self-center">
                  {isSelected ? (
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-200 rounded-full" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Comparison Table ────────────────────────────────────────────────────────

function ComparisonTable({
  russiaProduct,
  chinaProduct,
  qty,
}: {
  russiaProduct: ProductData;
  chinaProduct: ChinaProduct;
  qty: number;
}) {
  const chinaUnitPrice = getBestPrice(chinaProduct.price_tiers, qty);
  const chinaTotal = chinaUnitPrice * qty;
  const chinaTotalRub = cnyToRub(chinaTotal);
  const russiaTotal = russiaProduct.price * qty;
  const difference = russiaTotal - chinaTotalRub;
  const marginPercent = russiaTotal > 0 ? ((difference / russiaTotal) * 100) : 0;

  // Weight
  const chinaWeightKg = chinaProduct.unit_weight_kg;
  const russiaWeightKg = russiaProduct.weight ? russiaProduct.weight / 1000 : null;
  const weightPerUnit = chinaWeightKg || russiaWeightKg;
  const totalWeightKg = weightPerUnit ? weightPerUnit * qty : null;

  // Volume
  const volumeM3 = calcTotalVolume(russiaProduct.dimensions, qty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-gray-50">
        <h3 className="font-semibold text-gray-900">Сравнение и расчёт</h3>
      </div>

      <div className="p-5">
        {/* Main comparison grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-sm text-gray-400 font-medium" />
          <div className="text-center">
            <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
              russiaProduct.source === "wb" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}>
              {russiaProduct.source === "wb" ? "WB" : "Ozon"}
            </span>
          </div>
          <div className="text-center">
            <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-orange-100 text-orange-700">
              1688
            </span>
          </div>

          {/* Unit price */}
          <div className="text-sm text-gray-500">Цена за шт</div>
          <div className="text-center font-semibold text-gray-900">{fmt(russiaProduct.price)} ₽</div>
          <div className="text-center font-semibold text-gray-900">
            {fmtCny(chinaUnitPrice)} <span className="text-gray-400 font-normal">≈ {fmt(cnyToRub(chinaUnitPrice))} ₽</span>
          </div>

          {/* Total */}
          <div className="text-sm text-gray-500">Итого ({fmt(qty)} шт)</div>
          <div className="text-center font-bold text-lg text-gray-900">{fmt(russiaTotal)} ₽</div>
          <div className="text-center font-bold text-lg text-gray-900">
            {fmtCny(chinaTotal)} <span className="text-gray-400 font-normal text-sm">≈ {fmt(chinaTotalRub)} ₽</span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{fmt(difference)} ₽</div>
            <div className="text-xs text-green-600 mt-1">Разница</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{marginPercent.toFixed(1)}%</div>
            <div className="text-xs text-blue-600 mt-1">Маржа (грубо)</div>
          </div>
          {totalWeightKg != null && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">
                {totalWeightKg >= 1000 ? `${(totalWeightKg / 1000).toFixed(1)} т` : `${totalWeightKg.toFixed(1)} кг`}
              </div>
              <div className="text-xs text-orange-600 mt-1">Общий вес</div>
            </div>
          )}
          {volumeM3 != null && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{volumeM3.toFixed(3)} м³</div>
              <div className="text-xs text-purple-600 mt-1">Объём</div>
            </div>
          )}
        </div>

        {/* Price tiers */}
        {chinaProduct.price_tiers.length > 1 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Оптовые цены на 1688</div>
            <div className="flex flex-wrap gap-2">
              {chinaProduct.price_tiers.map((t, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    qty >= t.min_qty &&
                    (i === chinaProduct.price_tiers.length - 1 || qty < chinaProduct.price_tiers[i + 1]?.min_qty)
                      ? "bg-red-600 text-white font-medium"
                      : "bg-white border border-gray-200 text-gray-600"
                  }`}
                >
                  от {t.min_qty} шт — {fmtCny(t.price)} (≈{fmt(cnyToRub(t.price))} ₽)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail link */}
        <a
          href={chinaProduct.detail_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Открыть товар на 1688
          <ExternalLinkIcon className="w-3.5 h-3.5" />
        </a>

        {/* Disclaimer */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          Курс ¥1 ≈ {CNY_TO_RUB} ₽. Расчёт не включает пошлины, НДС, логистику и маркировку.
          Точный расчёт себестоимости — в следующей версии.
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProductSearchPage() {
  const [url, setUrl] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [chinaResults, setChinaResults] = useState<ChinaSearchResult | null>(null);
  const [selectedChinaIndex, setSelectedChinaIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const platform = url ? detectPlatform(url) : null;
  const qtyNum = parseInt(qty, 10) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setProduct(null);
    setChinaResults(null);
    setSelectedChinaIndex(null);
    setSelectedImage(0);
    setStep(1);

    if (!url.trim()) {
      setError("Вставьте ссылку на товар");
      return;
    }
    if (!platform) {
      setError("Поддерживаются только ссылки на Wildberries и Ozon");
      return;
    }
    if (qtyNum <= 0) {
      setError("Укажите количество товаров");
      return;
    }

    setLoading(true);

    try {
      // Step 2: Parse product from WB/Ozon
      setStep(2);
      setLoadingStage("Загружаем товар с " + (platform === "wb" ? "Wildberries" : "Ozon") + "…");

      const parseRes = await fetch("/api/parse-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const parseData = await parseRes.json();

      if (!parseRes.ok || parseData.error) {
        throw new Error(parseData.error || "Ошибка при загрузке товара");
      }

      const prod: ProductData = parseData.product;
      setProduct(prod);

      // Step 3: Search on 1688
      setStep(3);
      setLoadingStage("Ищем аналоги на 1688…");

      const chinaRes = await fetch("/api/search-china", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: prod.name,
          imageUrl: prod.images[0] || null,
        }),
      });
      const chinaData = await chinaRes.json();

      if (chinaRes.ok && chinaData.products && chinaData.products.length > 0) {
        setChinaResults(chinaData);
        setSelectedChinaIndex(0); // Auto-select first result
        setStep(4);
      } else {
        setChinaResults({ searchMethod: "text", totalFound: 0, products: [] });
        setStep(4);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Произошла ошибка";
      setError(msg === "fetch failed" || msg === "Failed to fetch"
        ? "Не удалось подключиться к серверу. Проверьте соединение и попробуйте ещё раз."
        : msg);
      setStep(1);
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  }

  function handleReset() {
    setUrl("");
    setQty("");
    setProduct(null);
    setChinaResults(null);
    setSelectedChinaIndex(null);
    setError("");
    setStep(1);
    setSelectedImage(0);
  }

  const selectedChina =
    chinaResults && selectedChinaIndex !== null
      ? chinaResults.products[selectedChinaIndex]
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Поиск товара для импорта</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Вставьте ссылку на товар с WB или Ozon — система найдёт его на 1688 и рассчитает стоимость партии
        </p>
      </div>

      <StepIndicator step={step} loading={loading} />

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid md:grid-cols-[1fr,200px] gap-4 mb-5">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ссылка на товар</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <LinkIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.wildberries.ru/catalog/..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-24 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white outline-none transition-all placeholder:text-gray-300"
              />
              {platform && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    platform === "wb" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {platform === "wb" ? "Wildberries" : "Ozon"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Количество (шт)</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="100"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white outline-none transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <SpinnerIcon className="w-4 h-4" />
                {loadingStage}
              </>
            ) : (
              <>
                <SearchIcon className="w-4 h-4" />
                Найти и сравнить
              </>
            )}
          </button>
          {product && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Сбросить
            </button>
          )}
        </div>
      </motion.form>

      {/* Loading skeleton */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64">
                  <div className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
                  <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
                  <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-14 bg-gray-100 rounded animate-pulse" />
                    <div className="h-14 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {product && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Russia product */}
            <RussiaProductCard
              product={product}
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
            />

            {/* China results */}
            {chinaResults && chinaResults.products.length > 0 && (
              <ChinaProductCards
                products={chinaResults.products}
                selectedIndex={selectedChinaIndex}
                onSelect={setSelectedChinaIndex}
                qty={qtyNum}
              />
            )}

            {chinaResults && chinaResults.products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"
              >
                <p className="text-amber-700 font-medium mb-1">Аналоги на 1688 не найдены</p>
                <p className="text-sm text-amber-600">
                  Попробуйте другой товар или проверьте, что фото товара доступно
                </p>
              </motion.div>
            )}

            {/* Comparison */}
            {selectedChina && (
              <ComparisonTable
                russiaProduct={product}
                chinaProduct={selectedChina}
                qty={qtyNum}
              />
            )}

            {/* Roadmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
            >
              <h3 className="font-semibold mb-3">Следующие этапы</h3>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Матчинг ТН ВЭД кодов по категориям</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Расчёт пошлин, НДС 22% и таможенных сборов</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Тарифы на логистику (море, авиа, ж/д)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Маркировка Честный знак</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Полная себестоимость единицы товара</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Маржинальность и ROI</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
