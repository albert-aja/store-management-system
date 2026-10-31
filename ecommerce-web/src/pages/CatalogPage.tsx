import { useI18n } from '../i18n';
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { storefrontApi } from "../services/api";
import { Category, ProductSummary } from "../types";
import { ProductCard } from "../components/ProductCard";
import { preloadCriticalImages } from "../utils/imageOptimizer";

export const CatalogPage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("query") || "";
  const categoryParam = searchParams.get("category") || "";
  const availabilityParam = searchParams.get("availability") || "ALL";

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedAvailability, setSelectedAvailability] =
    useState(availabilityParam);
  const [sortBy, setSortBy] = useState("DEFAULT");

  useEffect(() => {
    storefrontApi.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setSearchQuery(queryParam);
    setSelectedCategory(categoryParam);
    setSelectedAvailability(availabilityParam);
  }, [queryParam, categoryParam, availabilityParam]);

  useEffect(() => {
    const fetchFiltered = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const data = await storefrontApi.getProducts({
          query: searchQuery,
          availability: selectedAvailability,
        });

        let result = data;
        if (selectedCategory) {
          result = result.filter((p) =>
            p.categoryName
              .toLowerCase()
              .includes(selectedCategory.toLowerCase()),
          );
        }

        if (sortBy === "PRICE_LOW") {
          result = [...result].sort((a, b) => a.minPrice - b.minPrice);
        } else if (sortBy === "PRICE_HIGH") {
          result = [...result].sort((a, b) => b.minPrice - a.minPrice);
        }

        setProducts(result);
        // Backlog [P.22]: Preload top 4 above-the-fold catalog cards for minimal LCP
        preloadCriticalImages(
          result.slice(0, 4).map((p) => p.primaryImageUrl),
          { preset: "card", fetchPriority: "high" },
          4,
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (showLoading) setLoading(false);
      }
    };
    fetchFiltered();
    const refresh = window.setInterval(() => fetchFiltered(false), 15000);
    return () => window.clearInterval(refresh);
  }, [searchQuery, selectedCategory, selectedAvailability, sortBy]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      query: searchQuery,
      category: selectedCategory,
      availability: selectedAvailability,
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedAvailability("ALL");
    setSortBy("DEFAULT");
    setSearchParams({});
  };

  return (
    <div className="container-custom py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="section-title">
          {t("Katalog Produk")}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t("Pilihan lengkap produk elektronik, home appliances, dan perabot rumah resmi SMS Mart.")}</p>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <form
          onSubmit={handleApplyFilter}
          className="flex flex-col md:flex-row gap-3"
        >
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t("Cari nama produk, brand, atau spesifikasi...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t("Cari produk")}
              className="field pl-11"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            aria-label={t("Kategori")}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="field md:w-auto"
          >
            <option value="">{t("Semua Kategori")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            aria-label={t("Urutkan produk")}
            onChange={(e) => setSortBy(e.target.value)}
            className="field md:w-auto"
          >
            <option value="DEFAULT">{t("Urutan: Rekomendasi")}</option>
            <option value="PRICE_LOW">{t("Harga: Termurah ke Tertinggi")}</option>
            <option value="PRICE_HIGH">{t("Harga: Tertinggi ke Termurah")}</option>
          </select>

          <button
            type="submit"
            className="button-primary"
          >
            {t("Terapkan")}</button>

          {(searchQuery ||
            selectedCategory ||
            selectedAvailability !== "ALL") && (
            <button
              type="button"
              onClick={resetFilters}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("Reset")}</span>
            </button>
          )}
        </form>

        {/* Commercial Availability Quick Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">{t("Status Stok:")}</span>
          <button
            type="button"
            onClick={() => setSelectedAvailability("ALL")}
            className={`px-3 py-1 rounded-full font-semibold transition ${
              selectedAvailability === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t("Semua (")}{products.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedAvailability("IN_STOCK")}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold transition ${
              selectedAvailability === "IN_STOCK"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> {" " + t("Ready Stock")}</button>
          <button
            type="button"
            onClick={() =>
              setSelectedAvailability("AVAILABLE_PROCUREMENT_REQUIRED")
            }
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold transition ${
              selectedAvailability === "AVAILABLE_PROCUREMENT_REQUIRED"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> {" " + t("Indent (Pengadaan 3-5 Hari)")}</button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 bg-slate-200 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            {t("Tidak ada produk yang cocok dengan pencarian Anda")}</p>
          <p className="text-xs text-slate-400">
            {t("Silakan ubah kata kunci atau reset filter status ketersediaan.")}</p>
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-sky-600 hover:underline pt-2 inline-block"
          >
            {t("Tampilkan Semua Produk")}</button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p, idx) => (
            <ProductCard key={p.id} product={p} priority={idx < 4} />
          ))}
        </div>
      )}
    </div>
  );
};
