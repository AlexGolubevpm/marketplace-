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

interface ChinaSearchLinks {
  search1688?: string;
  imageSearch1688?: string;
  searchTaobao?: string;
  searchAliExpress?: string;
  searchDHGate?: string;
}

type CalcMode = "quantity" | "price";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(n: number): string {
  return n.toLocaleString("ru-RU");
}

function detectPlatform(
  url: string
): "wb" | "ozon" | null {
  if (url.includes("wildberries.ru")) return "wb";
  if (url.includes("ozon.ru")) return "ozon";
  return null;
}

// ─── Icons (inline SVG) ─────────────────────────────────────────────────────

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function LinkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.07a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374"
      />
    </svg>
  );
}

function PackageIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );
}

function ExternalLinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  );
}

function SpinnerIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Product Card Component ──────────────────────────────────────────────────

function ProductCard({
  product,
  selectedImage,
  onSelectImage,
}: {
  product: ProductData;
  selectedImage: number;
  onSelectImage: (i: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Images */}
        <div className="md:w-80 p-4">
          {product.images.length > 0 && (
            <div>
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3EНет фото%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectImage(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === selectedImage
                          ? "border-red-500"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              {product.brand && (
                <span className="text-sm text-gray-400 font-medium">
                  {product.brand}
                </span>
              )}
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                {product.name}
              </h3>
            </div>
            <span
              className={`flex-shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wide ${
                product.source === "wb"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {product.source === "wb" ? "WB" : "Ozon"}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)} ₽
            </span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.originalPrice)} ₽
                </span>
                <span className="px-2 py-0.5 text-sm font-semibold bg-red-100 text-red-600 rounded-md">
                  -{product.discount}%
                </span>
              </>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {product.category && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-0.5">Категория</div>
                <div className="font-medium text-gray-700">
                  {product.category}
                </div>
              </div>
            )}
            {product.subcategory && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-0.5">
                  Подкатегория
                </div>
                <div className="font-medium text-gray-700">
                  {product.subcategory}
                </div>
              </div>
            )}
            {product.weight && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-0.5">Вес</div>
                <div className="font-medium text-gray-700">
                  {product.weight >= 1000
                    ? `${(product.weight / 1000).toFixed(1)} кг`
                    : `${product.weight} г`}
                </div>
              </div>
            )}
            {product.dimensions && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-0.5">Габариты</div>
                <div className="font-medium text-gray-700">
                  {product.dimensions.length} × {product.dimensions.width} ×{" "}
                  {product.dimensions.height} см
                </div>
              </div>
            )}
            {product.rating && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-0.5">Рейтинг</div>
                <div className="font-medium text-gray-700">
                  ⭐ {product.rating.toFixed(1)}
                  {product.reviewCount != null && (
                    <span className="text-gray-400 ml-1">
                      ({formatPrice(product.reviewCount)} отз.)
                    </span>
                  )}
                </div>
              </div>
            )}
            {product.quantity != null && product.quantity > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-0.5">В наличии</div>
                <div className="font-medium text-gray-700">
                  {formatPrice(product.quantity)} шт.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calculation Results ─────────────────────────────────────────────────────

function CalculationResults({
  product,
  calcMode,
  calcValue,
}: {
  product: ProductData;
  calcMode: CalcMode;
  calcValue: number;
}) {
  let qty: number;
  if (calcMode === "quantity") {
    qty = calcValue;
  } else {
    // calcMode === "price" → calculate how many fit in budget
    qty = Math.floor(calcValue / product.price);
  }

  if (qty <= 0) qty = 1;

  const totalRussia = product.price * qty;
  const totalWeight = product.weight ? product.weight * qty : null;
  const totalVolume =
    product.dimensions
      ? ((product.dimensions.length *
          product.dimensions.width *
          product.dimensions.height) /
          1_000_000) *
        qty
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PackageIcon className="w-5 h-5 text-gray-400" />
        Расчёт партии
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {formatPrice(qty)}
          </div>
          <div className="text-xs text-blue-500 mt-1">Количество, шт</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {formatPrice(totalRussia)} ₽
          </div>
          <div className="text-xs text-green-500 mt-1">
            Стоимость в РФ
          </div>
        </div>
        {totalWeight && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">
              {totalWeight >= 1000
                ? `${(totalWeight / 1000).toFixed(1)} кг`
                : `${totalWeight} г`}
            </div>
            <div className="text-xs text-orange-500 mt-1">
              Общий вес
            </div>
          </div>
        )}
        {totalVolume != null && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {totalVolume < 0.01
                ? `${(totalVolume * 1_000_000).toFixed(0)} см³`
                : `${totalVolume.toFixed(3)} м³`}
            </div>
            <div className="text-xs text-purple-500 mt-1">Объём</div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
        <p>
          Цена за единицу:{" "}
          <span className="font-semibold text-gray-700">
            {formatPrice(product.price)} ₽
          </span>
          {product.weight && (
            <>
              {" "}
              · Вес единицы:{" "}
              <span className="font-semibold text-gray-700">
                {product.weight >= 1000
                  ? `${(product.weight / 1000).toFixed(1)} кг`
                  : `${product.weight} г`}
              </span>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}

// ─── China Search Links ──────────────────────────────────────────────────────

function ChinaSearchSection({
  links,
  productName,
}: {
  links: ChinaSearchLinks;
  productName: string;
}) {
  const platforms = [
    {
      key: "imageSearch1688",
      label: "1688 (поиск по фото)",
      color: "bg-orange-500",
      desc: "Крупнейший B2B маркетплейс Китая",
    },
    {
      key: "search1688",
      label: "1688 (по названию)",
      color: "bg-orange-400",
      desc: "Текстовый поиск на 1688",
    },
    {
      key: "searchTaobao",
      label: "Taobao",
      color: "bg-red-500",
      desc: "Розничный маркетплейс Alibaba",
    },
    {
      key: "searchAliExpress",
      label: "AliExpress",
      color: "bg-red-600",
      desc: "Международная площадка Alibaba",
    },
    {
      key: "searchDHGate",
      label: "DHGate",
      color: "bg-yellow-500",
      desc: "B2B маркетплейс с мелким оптом",
    },
  ] as const;

  const available = platforms.filter(
    (p) => links[p.key as keyof ChinaSearchLinks]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <SearchIcon className="w-5 h-5 text-gray-400" />
        Поиск в Китае
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Ищем «{productName.length > 60 ? productName.slice(0, 60) + "…" : productName}» на
        китайских площадках
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {available.map((p) => (
          <a
            key={p.key}
            href={links[p.key as keyof ChinaSearchLinks]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div
              className={`w-10 h-10 ${p.color} rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
            >
              CN
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                {p.label}
              </div>
              <div className="text-xs text-gray-400">{p.desc}</div>
            </div>
            <ExternalLinkIcon className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors flex-shrink-0" />
          </a>
        ))}
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        💡 В следующей версии здесь будут реальные цены из Китая с автоматическим
        расчётом разницы и маржинальности
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProductSearchPage() {
  const [url, setUrl] = useState("");
  const [calcMode, setCalcMode] = useState<CalcMode>("quantity");
  const [calcValue, setCalcValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [product, setProduct] = useState<ProductData | null>(null);
  const [chinaLinks, setChinaLinks] = useState<ChinaSearchLinks | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const platform = url ? detectPlatform(url) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setProduct(null);
    setChinaLinks(null);
    setSelectedImage(0);

    if (!url.trim()) {
      setError("Вставьте ссылку на товар");
      return;
    }

    if (!platform) {
      setError("Поддерживаются только ссылки на Wildberries и Ozon");
      return;
    }

    const numValue = parseFloat(calcValue);
    if (!calcValue || isNaN(numValue) || numValue <= 0) {
      setError(
        calcMode === "quantity"
          ? "Укажите количество товаров"
          : "Укажите целевую сумму в рублях"
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Parse the product
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

      // 2. Get China search links
      try {
        const chinaRes = await fetch("/api/search-china", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: prod.name,
            imageUrl: prod.images[0] || null,
          }),
        });

        const chinaData = await chinaRes.json();

        if (chinaRes.ok && chinaData.searchLinks) {
          setChinaLinks(chinaData.searchLinks);
        }
      } catch {
        // China search is not critical
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла неизвестная ошибка"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setUrl("");
    setCalcValue("");
    setProduct(null);
    setChinaLinks(null);
    setError("");
    setSelectedImage(0);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Поиск товара для импорта
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Вставьте ссылку на товар с Wildberries или Ozon — мы найдём его
          аналоги в Китае и рассчитаем стоимость партии
        </p>
      </div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* URL Input */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ссылка на товар
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <LinkIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.wildberries.ru/catalog/123456789/detail.aspx"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white outline-none transition-all placeholder:text-gray-300"
            />
            {platform && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    platform === "wb"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {platform === "wb" ? "Wildberries" : "Ozon"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Calculation Mode Toggle */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип расчёта
          </label>
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setCalcMode("quantity");
                setCalcValue("");
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                calcMode === "quantity"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              По количеству
            </button>
            <button
              type="button"
              onClick={() => {
                setCalcMode("price");
                setCalcValue("");
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                calcMode === "price"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              По бюджету
            </button>
          </div>
        </div>

        {/* Value Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {calcMode === "quantity"
              ? "Количество товаров (шт)"
              : "Бюджет закупки (₽)"}
          </label>
          <input
            type="number"
            min="1"
            value={calcValue}
            onChange={(e) => setCalcValue(e.target.value)}
            placeholder={
              calcMode === "quantity" ? "Например: 100" : "Например: 500000"
            }
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white outline-none transition-all placeholder:text-gray-300"
          />
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
                Загружаем товар…
              </>
            ) : (
              <>
                <SearchIcon className="w-4 h-4" />
                Рассчитать
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

      {/* Loading Skeleton */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-80">
                  <div className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="h-4 bg-gray-100 rounded-lg w-1/4 animate-pulse" />
                  <div className="h-6 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
                  <div className="h-10 bg-gray-100 rounded-lg w-1/3 animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Product Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProductCard
                product={product}
                selectedImage={selectedImage}
                onSelectImage={setSelectedImage}
              />
            </motion.div>

            {/* Calculation Results */}
            <CalculationResults
              product={product}
              calcMode={calcMode}
              calcValue={parseFloat(calcValue) || 1}
            />

            {/* China Search */}
            {chinaLinks && (
              <ChinaSearchSection
                links={chinaLinks}
                productName={product.name}
              />
            )}

            {/* Next Steps Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
            >
              <h3 className="font-semibold mb-3">
                Что будет в следующих версиях
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Автопоиск цен на 1688 и Taobao по фото</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Матчинг ТН ВЭД кодов по категориям</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Расчёт пошлин, НДС и таможенных сборов</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Тарифы на логистику (море, авиа, ж/д)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Расчёт полной себестоимости с маркировкой</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Маржинальность и рентабельность</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
