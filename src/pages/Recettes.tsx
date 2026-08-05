import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, 
  Coins, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  Car, 
  User, 
  ArrowLeftRight, 
  X, 
  RefreshCw,
  Building2,
  Calendar,
  Wallet,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO, format } from "date-fns";
import { toast } from "sonner";

interface ComboboxItem {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableComboboxProps {
  value: string;
  onValueChange: (val: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  items: ComboboxItem[];
  placeholder: string;
  emptyMessage: string;
}

function SearchableCombobox({
  value,
  onValueChange,
  query,
  onQueryChange,
  items,
  placeholder,
  emptyMessage
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = items.find(item => item.value === value);
  const displayValue = value === "tous" && !query ? "Tous" : (selectedItem ? selectedItem.label : query);

  const filteredItems = items.filter(item => {
    const filterText = query;
    if (!filterText) return true;
    const q = filterText.toLowerCase().trim();
    const labelMatch = item.label.toLowerCase().includes(q);
    const subLabelMatch = item.subLabel ? item.subLabel.toLowerCase().includes(q) : false;
    return labelMatch || subLabelMatch;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onQueryChange(val);
    if (value !== "tous") {
      onValueChange("tous");
    }
    setIsOpen(true);
  };

  const handleItemSelect = (itemValue: string) => {
    const item = items.find(i => i.value === itemValue);
    if (item) {
      onValueChange(itemValue);
      onQueryChange(item.label);
    } else {
      onValueChange("tous");
      onQueryChange("");
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("tous");
    onQueryChange("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={(e) => {
            e.currentTarget.select();
            setIsOpen(true);
          }}
          className="pl-9 pr-8 h-10 rounded-xl bg-slate-50 border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:border-slate-300"
        />
        {(value !== "tous" || query) ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg p-1 space-y-0.5">
          <button
            type="button"
            onClick={() => handleItemSelect("tous")}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              value === "tous" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tous
          </button>
          
          {filteredItems.length === 0 ? (
            <div className="p-3 text-xs text-center text-slate-400 font-medium">
              {emptyMessage}
            </div>
          ) : (
            filteredItems.map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleItemSelect(item.value)}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex flex-col ${
                  value === item.value
                    ? "bg-indigo-50 text-indigo-900 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{item.label}</span>
                {item.subLabel && (
                  <span className="text-[10px] text-slate-400 truncate mt-0.5">{item.subLabel}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Recettes() {
  const { t } = useTranslation();
  
  // State for data
  const [rentals, setRentals] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [typeFilter, setTypeFilter] = useState<string>("tous"); // tous, active, completed
  const [factureFilter, setFactureFilter] = useState<string>("tous"); // facture selection filter
  const [factureQuery, setFactureQuery] = useState<string>(""); // facture text search
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [agenceFilter, setAgenceFilter] = useState<string>("tous"); // branch ID for agence filter
  const [agenceType, setAgenceType] = useState<string>("both"); // depart, retour, both
  const [carFilter, setCarFilter] = useState<string>("tous"); // car ID dropdown filter
  const [carQuery, setCarQuery] = useState<string>(""); // text search query for vehicle
  const [customerFilter, setCustomerFilter] = useState<string>("tous"); // customer ID dropdown filter
  const [customerQuery, setCustomerQuery] = useState<string>(""); // text search query for client
  const [paymentFilter, setPaymentFilter] = useState<string>("tous"); // Espèces, Chèque, etc.
  const [localFilter, setLocalFilter] = useState<string>("tous"); // native branch_id filter (filtre par local)
  const [factureSearchInput, setFactureSearchInput] = useState<string>(""); 
  const [carSearchInput, setCarSearchInput] = useState<string>(""); 
  const [customerSearchInput, setCustomerSearchInput] = useState<string>(""); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rentalsData, branchesData, carsData, customersData, agenciesData] = await Promise.all([
        api.getRentals(),
        api.getBranches(),
        api.getCars(),
        api.getCustomers(),
        api.getAgencies()
      ]);
      setRentals(rentalsData || []);
      setBranches(branchesData || []);
      setCars(carsData || []);
      setCustomers(customersData || []);
      setAgencies(agenciesData || []);
    } catch (error: any) {
      console.error("Error fetching data for Recettes:", error);
      toast.error("Erreur de chargement des recettes de location");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8" /><style>table { border-collapse: collapse; } td, th { border: 1px solid #cbd5e1; padding: 6px; font-family: sans-serif; }</style></head>`;
    html += `<body><h2>Recettes de Location</h2><table>`;
    
    // Headers
    html += `<tr style="background-color: #f1f5f9; font-weight: bold;">`;
    html += `<th>N° Facture / Contrat</th>`;
    html += `<th>Client</th>`;
    html += `<th>Chauffeur</th>`;
    html += `<th>Tél Client</th>`;
    html += `<th>Véhicule</th>`;
    html += `<th>Immatriculation</th>`;
    html += `<th>Agence</th>`;
    html += `<th>Local</th>`;
    html += `<th>Date Début</th>`;
    html += `<th>Date Fin</th>`;
    html += `<th>Durée (jours)</th>`;
    html += `<th>Mode Paiement</th>`;
    html += `<th>Statut</th>`;
    html += `<th>Montant Total (DT)</th>`;
    html += `<th>Montant Payé (DT)</th>`;
    html += `<th>Reste à Payer (DT)</th>`;
    html += `</tr>`;

    // Rows
    filteredRentals.forEach(r => {
      const duration = r.rental_days || differenceInDays(parseISO(r.end_date), parseISO(r.start_date)) || 1;
      const price = parseFloat(r.total_price) || 0;
      const paid = parseFloat(r.amount_paid) || 0;
      const remaining = Math.max(0, price - paid);
      
      const branch = branches.find(b => b.id === r.branch_id);
      const agency = branch ? agencies.find(a => a.id === branch.agency_id) : null;

      let customerName = r.customer_name || "Nom inconnu";
      let driverName = r.driver_name || "Même que client";
      const vehicleText = r.brand && r.model ? `${r.brand} ${r.model}` : `Véhicule ID ${r.car_id}`;
      const registration = r.registration || "Non renseignée";

      html += `<tr>`;
      html += `<td>${r.contract_number || r.lease_group_number || r.id}</td>`;
      html += `<td>${customerName}</td>`;
      html += `<td>${driverName}</td>`;
      html += `<td>${r.customer_phone || ""}</td>`;
      html += `<td>${vehicleText}</td>`;
      html += `<td>${registration}</td>`;
      html += `<td>${agency ? agency.name : "N/A"}</td>`;
      html += `<td>${branch ? branch.name : (r.departure_place || "N/A")}</td>`;
      html += `<td>${format(parseISO(r.start_date), "dd/MM/yyyy")}</td>`;
      html += `<td>${format(parseISO(r.end_date), "dd/MM/yyyy")}</td>`;
      html += `<td>${duration}</td>`;
      html += `<td>${r.payment_mode || "Espèces"}</td>`;
      html += `<td>${r.status === 'active' ? 'En cours' : r.status === 'completed' ? 'Achevée' : r.status === 'scheduled' ? 'Réservée' : 'Annulée'}</td>`;
      html += `<td>${price.toFixed(3)}</td>`;
      html += `<td>${paid.toFixed(3)}</td>`;
      html += `<td>${remaining.toFixed(3)}</td>`;
      html += `</tr>`;
    });

    // Totals Row
    html += `<tr style="background-color: #f8fafc; font-weight: bold;">`;
    html += `<td colspan="13" style="text-align: right;">TOTAL:</td>`;
    html += `<td>${totalRentalAmount.toFixed(3)}</td>`;
    html += `<td>${totalReceived.toFixed(3)}</td>`;
    html += `<td>${totalRemaining.toFixed(3)}</td>`;
    html += `</tr>`;

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recettes_location_${format(new Date(), "yyyyMMdd_HHmmss")}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Extraction Excel (.xls) réussie");
  };

  const handleResetFilters = () => {
    setTypeFilter("tous");
    setFactureFilter("tous");
    setFactureQuery("");
    setStartDate("");
    setEndDate("");
    setAgenceFilter("tous");
    setAgenceType("both");
    setCarFilter("tous");
    setCarQuery("");
    setCustomerFilter("tous");
    setCustomerQuery("");
    setPaymentFilter("tous");
    setLocalFilter("tous");
    setFactureSearchInput("");
    setCarSearchInput("");
    setCustomerSearchInput("");
    toast.success("Filtres réinitialisés");
  };

  // Filtering Logic
  const filteredRentals = rentals.filter(r => {
    // 1. Type de location (status: tous, en cours = active, achevées = completed)
    if (typeFilter !== "tous") {
      if (r.status !== typeFilter) return false;
    }

    // 2. Numéro de facture / contrat (liste)
    if (factureFilter !== "tous") {
      const contractNum = r.contract_number?.toString() || "";
      const groupNum = r.lease_group_number?.toString() || "";
      const idStr = r.id?.toString() || "";
      if (contractNum !== factureFilter && groupNum !== factureFilter && idStr !== factureFilter) {
        return false;
      }
    } else if (factureQuery) {
      // 2b. Numéro de facture / contrat (recherche libre)
      const q = factureQuery.toLowerCase().trim();
      const contractNum = (r.contract_number || "").toLowerCase();
      const groupNum = (r.lease_group_number || "").toLowerCase();
      const idStr = r.id?.toString() || "";
      if (!contractNum.includes(q) && !groupNum.includes(q) && idStr !== q) {
        return false;
      }
    }

    // 3. Date : Choisir une période entre date de début et de fin
    // We check if the rental's start_date falls into the specified period bounds.
    if (startDate) {
      if (r.start_date < startDate) return false;
    }
    if (endDate) {
      if (r.start_date > endDate) return false;
    }

    // 4. Agence : Que ce soit un départ ou un retour
    if (agenceFilter !== "tous") {
      const selectedBranch = branches.find(b => b.id.toString() === agenceFilter);
      const selectedBranchName = selectedBranch ? selectedBranch.name.toLowerCase() : "";
      
      const isDepartMatch = r.branch_id?.toString() === agenceFilter || 
                           (r.departure_place || "").toLowerCase() === selectedBranchName;
      
      const isRetourMatch = (r.return_place || "").toLowerCase() === selectedBranchName;

      if (agenceType === "depart" && !isDepartMatch) return false;
      if (agenceType === "retour" && !isRetourMatch) return false;
      if (agenceType === "both" && !isDepartMatch && !isRetourMatch) return false;
    }

    // 5. Véhicule : Sélection ou recherche libre
    if (carFilter !== "tous") {
      if (r.car_id?.toString() !== carFilter) return false;
    } else if (carQuery) {
      const q = carQuery.toLowerCase().trim();
      const brand = (r.brand || "").toLowerCase();
      const model = (r.model || "").toLowerCase();
      const reg = (r.registration || "").toLowerCase();
      if (!brand.includes(q) && !model.includes(q) && !reg.includes(q)) {
        return false;
      }
    }

    // 6. Client : Sélection ou recherche libre
    if (customerFilter !== "tous") {
      if (r.customer_id?.toString() !== customerFilter && r.driver_id?.toString() !== customerFilter) return false;
    } else if (customerQuery) {
      const q = customerQuery.toLowerCase().trim();
      const custName = (r.customer_name || "").toLowerCase();
      const driverName = (r.driver_name || "").toLowerCase();
      const phone = (r.customer_phone || "").toLowerCase();
      if (!custName.includes(q) && !driverName.includes(q) && !phone.includes(q)) {
        return false;
      }
    }

    // 7. Mode de paiement
    if (paymentFilter !== "tous") {
      const rPayment = r.payment_mode || "Espèces";
      if (rPayment.toLowerCase() !== paymentFilter.toLowerCase()) return false;
    }

    // 8. Filtre par local (departure branch_id native field)
    if (localFilter !== "tous") {
      if (r.branch_id?.toString() !== localFilter) return false;
    }

    return true;
  });

  // Aggregated calculations based on the fully filtered list
  const totalRentalAmount = filteredRentals.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
  const totalReceived = filteredRentals.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0);
  const totalRemaining = filteredRentals.reduce((sum, r) => {
    const due = (parseFloat(r.total_price) || 0) - (parseFloat(r.amount_paid) || 0);
    return sum + (due > 0 ? due : 0);
  }, 0);

  // Available unique payment modes present in rentals for filtering
  const paymentModes = Array.from(new Set(rentals.map(r => r.payment_mode || "Espèces"))).filter(Boolean);

  // Available unique contract / invoice numbers
  const uniqueFactures = Array.from(
    new Set(
      rentals
        .reduce((acc: string[], r) => {
          if (r.contract_number) acc.push(r.contract_number);
          if (r.lease_group_number) acc.push(r.lease_group_number);
          return acc;
        }, [])
    )
  ).sort() as string[];

  // Combobox items mapping
  const comboboxFactures = uniqueFactures.map(f => ({
    value: f,
    label: `Facture N° ${f}`,
    subLabel: `Facture/Contrat N° ${f}`
  }));

  const comboboxCars = cars.map(c => ({
    value: c.id.toString(),
    label: `${c.brand} ${c.model} - ${c.registration}`,
    subLabel: `Immatriculation: ${c.registration}`
  }));

  const comboboxCustomers = customers.map(cust => {
    const fullName = cust.type === 'company' 
      ? cust.name 
      : `${cust.name || ""} ${cust.first_name || ""}`.trim();
    return {
      value: cust.id.toString(),
      label: fullName,
      subLabel: cust.phone ? `Tél: ${cust.phone}` : undefined
    };
  });

  return (
    <div className="space-y-4" id="recettes_page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Recettes de location</h1>
          <p className="text-xs text-slate-500">
            Consultez les états financiers des locations, suivez les versements et restes à payer avec filtres avancés.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-slate-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-2 font-semibold text-xs h-9"
            onClick={exportToExcel}
            disabled={loading || filteredRentals.length === 0}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            Exporter Excel (.xls)
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-slate-200 gap-2 text-xs h-9"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Analytics Cards Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Montant total de location */}
        <Card className="rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Montants de Location</p>
              <h3 className="text-2xl font-extrabold text-slate-900 font-mono">
                {totalRentalAmount.toFixed(3)} DT
              </h3>
              <p className="text-xs text-slate-500 font-semibold">{filteredRentals.length} locations filtrées</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Montant reçu */}
        <Card className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Coins className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reçu (Versé)</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {totalReceived.toFixed(3)} DT
                </h3>
                <p className="text-xs text-emerald-600 font-semibold">
                  {totalRentalAmount > 0 ? ((totalReceived / totalRentalAmount) * 100).toFixed(1) : 0}% collecté
                </p>
              </div>
            </div>
            {totalRentalAmount > 0 && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totalReceived / totalRentalAmount) * 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Reste à payer */}
        <Card className="rounded-2xl border border-slate-200 border-l-4 border-l-rose-500 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Restes à Payer</p>
                <h3 className="text-2xl font-extrabold text-rose-600 font-mono">
                  {totalRemaining.toFixed(3)} DT
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  {totalRentalAmount > 0 ? ((totalRemaining / totalRentalAmount) * 100).toFixed(1) : 0}% restant
                </p>
              </div>
            </div>
            {totalRentalAmount > 0 && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totalRemaining / totalRentalAmount) * 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter Panel */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center gap-3">
          <Filter className="w-5 h-5 text-slate-500" />
          <div>
            <CardTitle className="text-base font-semibold">Filtres de recherche avancés</CardTitle>
            <CardDescription className="text-xs">Affinez les recettes en temps réel</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleResetFilters}
            className="ml-auto text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-1 rounded-lg px-2 h-8"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réinitialiser
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filter 1: Type de location */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Type de location</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger 
                  className="h-10 rounded-xl bg-slate-50 border-slate-200"
                  showClear={typeFilter !== "tous" && typeFilter !== ""}
                  onClear={() => setTypeFilter("tous")}
                >
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="active">En cours</SelectItem>
                  <SelectItem value="completed">Déjà achevées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter 2 & 3: Date début et fin */}
            <div className="space-y-1.5 col-span-1 md:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Date début</Label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Date fin</Label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* Filter 4: Mode de paiement */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Mode de paiement</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger 
                  className="h-10 rounded-xl bg-slate-50 border-slate-200"
                  showClear={paymentFilter !== "tous" && paymentFilter !== ""}
                  onClear={() => setPaymentFilter("tous")}
                >
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="tous">Tous</SelectItem>
                  {paymentModes.map(mode => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                  {!paymentModes.includes("Espèces") && <SelectItem value="Espèces">Espèces</SelectItem>}
                  {!paymentModes.includes("Chèque") && <SelectItem value="Chèque">Chèque</SelectItem>}
                  {!paymentModes.includes("Carte Bancaire") && <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>}
                  {!paymentModes.includes("Virement") && <SelectItem value="Virement">Virement</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Combobox Search fields & Agence */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            {/* Filter 5: Facture / Contrat */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Facture / Contrat</Label>
              <SearchableCombobox
                value={factureFilter}
                onValueChange={setFactureFilter}
                query={factureQuery}
                onQueryChange={setFactureQuery}
                items={comboboxFactures}
                placeholder="Rechercher facture ou contrat..."
                emptyMessage="Aucune facture trouvée"
              />
            </div>

            {/* Filter 6: Véhicule */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Véhicule</Label>
              <SearchableCombobox
                value={carFilter}
                onValueChange={setCarFilter}
                query={carQuery}
                onQueryChange={setCarQuery}
                items={comboboxCars}
                placeholder="Rechercher marque, modèle, immatriculation..."
                emptyMessage="Aucun véhicule trouvé"
              />
            </div>

            {/* Filter 7: Client */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Client</Label>
              <SearchableCombobox
                value={customerFilter}
                onValueChange={setCustomerFilter}
                query={customerQuery}
                onQueryChange={setCustomerQuery}
                items={comboboxCustomers}
                placeholder="Rechercher nom, prénom, tél..."
                emptyMessage="Aucun client trouvé"
              />
            </div>

            {/* Filter 8: Agence */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Agence</Label>
              <Select value={agenceFilter} onValueChange={setAgenceFilter}>
                <SelectTrigger 
                  className="h-10 rounded-xl bg-slate-50 border-slate-200"
                  showClear={agenceFilter !== "tous" && agenceFilter !== ""}
                  onClear={() => setAgenceFilter("tous")}
                >
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="tous">Tous</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Agence movement and Local */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            {/* Filter 9: Mouvement agence */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Mouvement agence</Label>
              <Select value={agenceType} onValueChange={setAgenceType} disabled={agenceFilter === "tous"}>
                <SelectTrigger 
                  className="h-10 rounded-xl bg-slate-50 border-slate-200"
                  showClear={agenceType !== "both" && agenceType !== ""}
                  onClear={() => setAgenceType("both")}
                >
                  <SelectValue placeholder="Tous (Départ & Retour)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="both">Tous (Départ & Retour)</SelectItem>
                  <SelectItem value="depart">Départ uniquement</SelectItem>
                  <SelectItem value="retour">Retour uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter 10: Local */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Filtrer par local</Label>
              <Select value={localFilter} onValueChange={setLocalFilter}>
                <SelectTrigger 
                  className="h-10 rounded-xl bg-slate-50 border-slate-200"
                  showClear={localFilter !== "tous" && localFilter !== ""}
                  onClear={() => setLocalFilter("tous")}
                >
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="tous">Tous</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spacer columns */}
            <div className="hidden lg:block lg:col-span-2"></div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Liste des Locations & Détails financiers</CardTitle>
            <CardDescription className="text-xs">
              Affichage de {filteredRentals.length} sur {rentals.length} locations
            </CardDescription>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3">N° Facture / Contrat</th>
                <th className="py-2.5 px-3">Client & Chauffeur</th>
                <th className="py-2.5 px-3">Véhicule</th>
                <th className="py-2.5 px-3">Agence & Local</th>
                <th className="py-2.5 px-3 text-center">Période</th>
                <th className="py-2.5 px-2 text-center">Modes</th>
                <th className="py-2.5 px-2 text-center">Statut</th>
                <th className="py-2.5 px-3 text-right">Montant Total</th>
                <th className="py-2.5 px-3 text-right">Versé (Reçu)</th>
                <th className="py-2.5 px-3 text-right">Reste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Chargement des recettes...
                  </td>
                </tr>
              ) : filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Aucune location ne correspond aux filtres appliqués
                  </td>
                </tr>
              ) : (
                filteredRentals.map((r) => {
                  const duration = r.rental_days || differenceInDays(parseISO(r.end_date), parseISO(r.start_date)) || 1;
                  const price = parseFloat(r.total_price) || 0;
                  const paid = parseFloat(r.amount_paid) || 0;
                  const remaining = Math.max(0, price - paid);

                  // Extract human friendly client name
                  let customerName = r.customer_name || "Nom inconnu";
                  if (r.driver_name) {
                    customerName = r.driver_name;
                  }

                  const vehicleText = r.brand && r.model 
                    ? `${r.brand} ${r.model}` 
                    : `Véhicule ID ${r.car_id}`;
                  const registration = r.registration || "Non renseignée";

                  const branch = branches.find(b => b.id === r.branch_id);
                  const agency = branch ? agencies.find(a => a.id === branch.agency_id) : null;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* 1. Invoice/Contract Number & Date */}
                      <td className="py-2.5 px-3 font-medium text-slate-900 vertical-align-middle">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded-lg font-mono">
                            {r.contract_number || r.lease_group_number || `#${r.id}`}
                          </span>
                        </div>
                        {r.lease_group_number && (
                          <div className="text-[10px] text-blue-500 font-semibold mt-0.5">
                            Facture Groupée: {r.lease_group_number}
                          </div>
                        )}
                      </td>

                      {/* 2. Client & Phone */}
                      <td className="py-2.5 px-3 vertical-align-middle">
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{customerName}</span>
                        </div>
                        {r.customer_phone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{r.customer_phone}</div>
                        )}
                      </td>

                      {/* 3. Car Brand, Model & Plates */}
                      <td className="py-2.5 px-3 vertical-align-middle">
                        <div className="flex items-center gap-1 text-slate-800 text-xs">
                          <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate max-w-[120px]">{vehicleText}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{registration}</span>
                      </td>

                      {/* New column: Agence & Local */}
                      <td className="py-2.5 px-3 vertical-align-middle">
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[120px]">{agency ? agency.name : "N/A"}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[120px]" title={branch?.name}>
                          {branch ? branch.name : (r.departure_place || "N/A")}
                        </div>
                      </td>

                      {/* 4. Dates and Duration */}
                      <td className="py-2.5 px-3 text-center vertical-align-middle">
                        <div className="text-[11px] font-semibold text-slate-900 leading-tight">
                          {format(parseISO(r.start_date), "dd/MM/yyyy")}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">au</div>
                        <div className="text-[11px] font-semibold text-slate-900 leading-tight">
                          {format(parseISO(r.end_date), "dd/MM/yyyy")}
                        </div>
                        <Badge variant="outline" className="text-[9px] rounded-full px-1.5 py-0 mt-0.5 font-bold">
                          {duration} j
                        </Badge>
                      </td>

                      {/* 5. Payment mode */}
                      <td className="py-2.5 px-2 text-center vertical-align-middle">
                        <Badge className="bg-slate-100/80 text-slate-700 hover:bg-slate-100 font-medium rounded-full text-[10px] px-1.5 py-0.5 border-slate-200">
                          {r.payment_mode || "Espèces"}
                        </Badge>
                      </td>

                      {/* 6. Status of lease */}
                      <td className="py-2.5 px-2 text-center vertical-align-middle">
                        {r.status === "active" ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-full text-[10px] hover:bg-blue-150 py-0 px-1.5 font-bold">
                            En cours
                          </Badge>
                        ) : r.status === "completed" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full text-[10px] hover:bg-emerald-150 py-0 px-1.5 font-bold">
                            Achevée
                          </Badge>
                        ) : r.status === "scheduled" ? (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-200 rounded-full text-[10px] hover:bg-purple-150 py-0 px-1.5 font-bold">
                            Réservée
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 rounded-full text-[10px] py-0 px-1.5 font-bold">
                            Annulée
                          </Badge>
                        )}
                      </td>

                      {/* 7. Total Contract Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-xs vertical-align-middle">
                        {price.toFixed(3)}
                        <span className="text-[10px] text-slate-500 font-sans font-normal ml-0.5">DT</span>
                      </td>

                      {/* 8. Total Amount Paid */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 text-xs vertical-align-middle">
                        {paid.toFixed(3)}
                        <span className="text-[10px] text-slate-500 font-sans font-normal ml-0.5">DT</span>
                      </td>

                      {/* 9. Remaining to pay */}
                      <td className="py-2.5 px-3 text-right vertical-align-middle">
                        <div className={`font-mono font-bold text-xs ${remaining > 0 ? "text-rose-600" : "text-slate-400"}`}>
                          {remaining.toFixed(3)}
                          <span className="text-[10px] text-slate-500 font-sans font-normal ml-0.5">DT</span>
                        </div>
                        {remaining > 0 && (
                          <div className="w-12 h-1 bg-slate-100 rounded-full ml-auto mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-rose-500" 
                              style={{ width: `${Math.min(100, (remaining / price) * 100)}%` }} 
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
