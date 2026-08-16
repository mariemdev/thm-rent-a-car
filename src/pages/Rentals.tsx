import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { 
  Plus, 
  PlusCircle,
  Search, 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  User, 
  Phone, 
  CreditCard,
  Car as CarIcon,
  MapPin,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  ArrowRight,
  Check,
  Users,
  Calendar,
  Zap,
  Eye,
  ImageIcon,
  Trash2,
  Gauge,
  ShieldCheck,
  MoreVertical,
  Edit2,
  RotateCcw,
  Camera,
  Receipt,
  AlertCircle,
  AlertTriangle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription as DialogDescriptionUI
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { generateContractPDF, generateInvoicePDF } from "@/lib/pdf";
import { TablePagination } from "@/components/TablePagination";

const TimeStepSelect = ({ value, onChange, label, required }: { value: string, onChange: (v: string) => void, label?: string, required?: boolean }) => {
  const [hours, minutes] = (value || "00:00").split(":");
  
  const updateTime = (h: string, m: string) => {
    onChange(`${h}:${m}`);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minuteOptions = ["00", "15", "30", "45"];

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-bold text-slate-600">{label} {required && <span className="text-red-500">*</span>}</Label>}
      <div className="flex items-center gap-2">
        <Select value={hours} onValueChange={(h) => updateTime(h, minutes)}>
          <SelectTrigger 
            className="h-12 rounded-xl text-lg bg-white border-slate-200 w-full"
            showClear={!!hours}
            onClear={() => updateTime("00", minutes)}
          >
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="max-h-[250px]">
            {hourOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="font-bold text-xl text-slate-400">:</span>
        <Select value={minutes} onValueChange={(m) => updateTime(hours, m)}>
          <SelectTrigger 
            className="h-12 rounded-xl text-lg bg-white border-slate-200 w-full"
            showClear={!!minutes}
            onClear={() => updateTime(hours, "00")}
          >
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default function Rentals({ showAdd = false }: { showAdd?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(showAdd);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [confirmReturnPayment, setConfirmReturnPayment] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showChauffeurSelect, setShowChauffeurSelect] = useState(false);
  const [editShowChauffeurSelect, setEditShowChauffeurSelect] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [swapBranchFilter, setSwapBranchFilter] = useState("all");
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [selectedExtendRental, setSelectedExtendRental] = useState<any>(null);
  const [extendData, setExtendData] = useState({
    end_date: "",
    return_time: "08:00",
    return_place: "",
    prolongation_place: "",
    new_payment: "0",
    new_payment_mode: "Espèces"
  });
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [swappingData, setSwappingData] = useState({
    new_car_id: "",
    old_car_return_mileage: "",
    old_car_return_fuel: 0,
    new_car_start_mileage: "",
    new_car_start_fuel: 0,
    swap_date: format(new Date(), "yyyy-MM-dd"),
    swap_reason: "",
    daily_price: "0",
    new_payment: "0",
    new_payment_mode: "Espèces"
  });
  const [editingRental, setEditingRental] = useState<any>(null);
  const [clientType, setClientType] = useState<'individual' | 'company'>('individual');
  const [showAddDepartureDropdown, setShowAddDepartureDropdown] = useState(false);
  const [showEditDepartureDropdown, setShowEditDepartureDropdown] = useState(false);
  const [showAddReturnDropdown, setShowAddReturnDropdown] = useState(false);
  const [showEditReturnDropdown, setShowEditReturnDropdown] = useState(false);
  const [customerAlertObservation, setCustomerAlertObservation] = useState<string | null>(null);
  const [alertCustomerName, setAlertCustomerName] = useState<string>("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const [settings, setSettings] = useState<any>(null);
  const [shouldGenerateContract, setShouldGenerateContract] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [activationRental, setActivationRental] = useState<any>(null);
  const [returningRental, setReturningRental] = useState<any>({
    return_date: format(new Date(), 'yyyy-MM-dd'),
    return_mileage: "",
    return_photos: [] as string[],
    fuel_return_bars: "",
    is_damaged: false,
    damage_deduction: "0"
  });

  const initialRentalState = {
    customer_id: "",
    customer_type: "individual",
    is_client_first_driver: true,
    customer_name: "",
    customer_phone: "",
    customer_id_type: "CIN",
    customer_id_number: "",
    customer_id_issued_date: "",
    customer_id_issued_at: "",
    customer_birth_date: "",
    customer_birth_place: "",
    customer_address: "",
    customer_profession: "",
    customer_license_number: "",
    customer_license_issued_date: "",
    customer_license_issued_at: "",
    
    driver_id: "",
    
    second_driver_name: "",
    second_driver_phone: "",
    second_driver_id_number: "",
    second_driver_id_issued_date: "",
    second_driver_id_issued_at: "",
    second_driver_birth_date: "",
    second_driver_birth_place: "",
    second_driver_address: "",
    second_driver_profession: "",
    second_driver_license_number: "",
    second_driver_license_issued_date: "",
    second_driver_license_issued_at: "",

    departure_place: "",
    departure_time: "08:00",
    return_place: "",
    return_time: "08:00",
    is_rental_days_overridden: false,
    rental_days: "",
    
    prolongation_date: "",
    prolongation_place: "",
    prolongation_time: "",

    km_depart: "",
    km_retour: "",
    km_parcouru: "",
    km_factures: "",

    payment_mode: "Espèces",
    deposit_amount: "",

    min_age_confirmed: true,
    license_duration_confirmed: true,
    km_allowance: 280,
    excess_km_price: 0.5,

    tax_id: "",
    other_charges: "0",
    vat: "0",
    stamp_duty: "1.000",

    fuel_total_bars: "8",
    fuel_depart_bars: "",
    fuel_return_bars: "0",
    car_condition_notes: "",
    amount_paid: "0",
    amount_remaining: "0",

    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    car_id: "",
    branch_id: "",
    daily_price: "",
    deposit: "",
    current_mileage: "",
    state_photos: [] as string[],
    has_second_driver: false,
    second_driver_id: ""
  };

  const [newRental, setNewRental] = useState(initialRentalState);

  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const FuelBarsSelector = ({ value, total, onChange, label, disabled = false }: { value: number, total: number, onChange: (v: number) => void, label?: string, disabled?: boolean }) => {
    return (
      <div className="space-y-2">
        {label && <Label className="text-sm font-bold text-slate-600">{label}</Label>}
        <div className="flex items-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value === (i + 1) ? 0 : (i + 1))}
              className={cn(
                "h-10 flex-1 rounded-sm transition-all border",
                i < value 
                  ? "bg-orange-500 border-orange-600 shadow-inner" 
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200",
                disabled && "cursor-not-allowed opacity-80"
              )}
              title={`${i + 1} / ${total} barres`}
            />
          ))}
          <span className="ml-2 text-sm font-bold text-slate-500">{value}/{total}</span>
        </div>
      </div>
    );
  };

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isCarAvailableForPeriod = (carId: number, start: string, end: string, excludeRentalId?: number) => {
    if (!start || !end) return true;
    const startDate = new Date(start);
    const endDate = new Date(end);

    return !rentals.some(rental => {
      if (excludeRentalId && rental.id === excludeRentalId) return false;
      if (rental.car_id !== carId || rental.status === 'cancelled') return false;
      const rStart = new Date(rental.start_date);
      const rEnd = new Date(rental.end_date);
      return (startDate <= rEnd && endDate >= rStart);
    });
  };

  const getAvailableCars = (start: string, end: string, branchIdOrName?: string, excludeRentalId?: number) => {
    return cars.filter(car => {
      const isNotMaintenance = car.status !== 'maintenance' && car.status !== 'archived';
      const matchesPeriod = isCarAvailableForPeriod(car.id, start, end, excludeRentalId);
      // Find branch details to support both ID or Name matching
      const branchOfCar = branches.find(b => b.id.toString() === car.branch_id?.toString());
      const matchesBranch = !branchIdOrName || 
                            branchIdOrName === "all" || 
                            car.branch_id?.toString() === branchIdOrName || 
                            branchOfCar?.name === branchIdOrName;
      return isNotMaintenance && matchesPeriod && matchesBranch;
    });
  };

  const availableCarsForNewRental = getAvailableCars(newRental.start_date, newRental.end_date, "all");
  const isCurrentCarAvailableForActivation = activationRental && activationRental.car_id ? isCarAvailableForPeriod(parseInt(activationRental.car_id), activationRental.start_date, activationRental.end_date, activationRental.id) : true;

  const lateRentals = rentals.filter(r => {
    if (r.status !== 'active') return false;
    const returnDateTime = new Date(`${r.end_date}T${r.return_time || "23:59"}`);
    return returnDateTime < new Date();
  });

  // Reset car selection if it's no longer available for the selected period or branch
  useEffect(() => {
    if (newRental.car_id && !availableCarsForNewRental.some(c => c.id.toString() === newRental.car_id)) {
      setNewRental(prev => ({ ...prev, car_id: "" }));
    }
  }, [availableCarsForNewRental, newRental.car_id]);

  // Synchronise amount_remaining for newRental
  useEffect(() => {
    const total = parseFloat(calculateTotalPrice(newRental));
    const paid = parseFloat(newRental.amount_paid || "0");
    const diff = (total - paid).toFixed(3);
    if (newRental.amount_remaining !== diff) {
      setNewRental(prev => ({ ...prev, amount_remaining: diff }));
    }
  }, [
    newRental.start_date,
    newRental.end_date,
    newRental.departure_time,
    newRental.return_time,
    newRental.is_rental_days_overridden,
    newRental.rental_days,
    newRental.daily_price,
    newRental.other_charges,
    newRental.vat,
    newRental.amount_paid
  ]);

  // Synchronise amount_remaining for editingRental
  useEffect(() => {
    if (!editingRental || !editingRental.id) return;
    const total = parseFloat(calculateTotalPrice(editingRental));
    const paid = parseFloat(editingRental.amount_paid || "0");
    const diff = (total - paid).toFixed(3);
    if (editingRental.amount_remaining !== diff) {
      setEditingRental(prev => {
        if (!prev) return prev;
        return { ...prev, amount_remaining: diff };
      });
    }
  }, [
    editingRental?.start_date,
    editingRental?.end_date,
    editingRental?.departure_time,
    editingRental?.return_time,
    editingRental?.is_rental_days_overridden,
    editingRental?.rental_days,
    editingRental?.daily_price,
    editingRental?.other_charges,
    editingRental?.vat,
    editingRental?.amount_paid,
    editingRental?.id
  ]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const readers = Array.from(files).map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(base64s => {
      setNewRental(prev => ({ ...prev, state_photos: [...prev.state_photos, ...base64s].slice(0, 5) }));
    });
  };

  const [customerSearch, setCustomerSearch] = useState("");
  const [primaryDriverSearch, setPrimaryDriverSearch] = useState("");
  const [secondDriverSearch, setSecondDriverSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");

  // Advanced filters states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterClientType, setFilterClientType] = useState<string>("all");
  const [filterClientName, setFilterClientName] = useState<string>("all_names");
  const [realFilterClientName, setRealFilterClientName] = useState<string>("");
  const [filterClientPhone, setFilterClientPhone] = useState<string>("");
  const [filterSelectedClientId, setFilterSelectedClientId] = useState<string>("all");
  const [filterCarBrand, setFilterCarBrand] = useState<string>("all");
  const [filterCarModel, setFilterCarModel] = useState<string>("all");
  const [filterCarReg, setFilterCarReg] = useState<string>("all");
  const [filterBranchId, setFilterBranchId] = useState<string>("all");
  const [filterDeparturePlace, setFilterDeparturePlace] = useState<string>("all");
  const [filterReturnPlace, setFilterReturnPlace] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Search filters for lists
  const [customerFilterSearch, setCustomerFilterSearch] = useState<string>("");
  const [vehicleBrandSearch, setVehicleBrandSearch] = useState<string>("");
  const [vehicleModelSearch, setVehicleModelSearch] = useState<string>("");
  const [vehicleRegSearch, setVehicleRegSearch] = useState<string>("");

  // Unique elements from active or past bookings
  const uniqueBrandsFromRentals = useMemo(() => {
    const brands = rentals
      .map(r => r.brand)
      .filter((b): b is string => !!b && b.trim() !== "");
    return Array.from(new Set(brands)).sort();
  }, [rentals]);

  const uniqueModelsFromRentals = useMemo(() => {
    const models = rentals
      .map(r => r.model)
      .filter((m): m is string => !!m && m.trim() !== "");
    return Array.from(new Set(models)).sort();
  }, [rentals]);

  const uniqueRegsFromRentals = useMemo(() => {
    const regs = rentals
      .map(r => r.registration)
      .filter((reg): reg is string => !!reg && reg.trim() !== "");
    return Array.from(new Set(regs)).sort();
  }, [rentals]);

  const uniqueDeparturePlaces = useMemo(() => {
    const places = new Set<string>();
    branches.forEach(b => { if (b.name) places.add(b.name); if (b.city) places.add(b.city); });
    rentals.forEach(r => { if (r.departure_place) places.add(r.departure_place); });
    return Array.from(places).sort();
  }, [branches, rentals]);

  const uniqueReturnPlaces = useMemo(() => {
    const places = new Set<string>();
    branches.forEach(b => { if (b.name) places.add(b.name); if (b.city) places.add(b.city); });
    rentals.forEach(r => { if (r.return_place) places.add(r.return_place); });
    return Array.from(places).sort();
  }, [branches, rentals]);

  // Dropdown lists filtering
  const filteredCustomersForDropdown = useMemo(() => {
    if (filterClientType === "all") {
      return [];
    }
    let list = customers;
    if (filterClientType === "individual") {
      list = list.filter(c => c.type === "individual");
    } else if (filterClientType === "company") {
      list = list.filter(c => c.type === "company");
    }
    if (customerFilterSearch.trim()) {
      const q = customerFilterSearch.toLowerCase();
      list = list.filter(c => {
        const fullName = `${c.name || ""} ${c.first_name || ""}`.toLowerCase();
        const email = (c.email || "").toLowerCase();
        const cin = (c.cin_number || "").toLowerCase();
        const phone = (c.phone || "").toLowerCase();
        return fullName.includes(q) || email.includes(q) || cin.includes(q) || phone.includes(q);
      });
    }
    return list;
  }, [customers, filterClientType, customerFilterSearch]);

  const filteredBrandsForDropdown = useMemo(() => {
    let list = uniqueBrandsFromRentals;
    if (vehicleBrandSearch.trim()) {
      const q = vehicleBrandSearch.toLowerCase();
      list = list.filter(b => b.toLowerCase().includes(q));
    }
    return list;
  }, [uniqueBrandsFromRentals, vehicleBrandSearch]);

  const filteredModelsForDropdown = useMemo(() => {
    let list = uniqueModelsFromRentals;
    if (vehicleModelSearch.trim()) {
      const q = vehicleModelSearch.toLowerCase();
      list = list.filter(m => m.toLowerCase().includes(q));
    }
    return list;
  }, [uniqueModelsFromRentals, vehicleModelSearch]);

  const filteredRegsForDropdown = useMemo(() => {
    let list = uniqueRegsFromRentals;
    if (vehicleRegSearch.trim()) {
      const q = vehicleRegSearch.toLowerCase();
      list = list.filter(reg => reg.toLowerCase().includes(q));
    }
    return list;
  }, [uniqueRegsFromRentals, vehicleRegSearch]);

  // Sorting states
  const [sortField, setSortField] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const resetAllFilters = () => {
    setFilterStatus("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterClientType("all");
    setRealFilterClientName("");
    setFilterClientPhone("");
    setFilterSelectedClientId("all");
    setFilterCarBrand("all");
    setFilterCarModel("all");
    setFilterCarReg("all");
    setFilterBranchId("all");
    setFilterDeparturePlace("all");
    setFilterReturnPlace("all");
    setSearch("");
    setBranchFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setCustomerFilterSearch("");
    setVehicleBrandSearch("");
    setVehicleModelSearch("");
    setVehicleRegSearch("");
  };

  useEffect(() => {
    setIsAddOpen(showAdd);
    if (showAdd) {
      setNewRental({
        ...initialRentalState,
        km_allowance: settings?.km_allowance || 280,
        excess_km_price: settings?.excess_km_price || 0.5
      });
      setShowChauffeurSelect(false);
    }
  }, [showAdd, settings]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r, c, b, s, cust] = await Promise.all([
        api.getRentals(), 
        api.getCars(), 
        api.getBranches(),
        api.getSettings(),
        api.getCustomers()
      ]);
      console.log('Rentals - fetched data:', { rentalsCount: r.length, carsCount: c.length, branchesCount: b.length, customersCount: cust.length });
      console.log('Rentals - customers data:', cust);
      setRentals(r.sort((a: any, b: any) => b.id - a.id));
      setCars(c);
      setBranches(b);
      setSettings(s);
      setCustomers(cust);
    } catch (error) {
      console.error('Rentals - fetch error:', error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCustomerSelect = (v: string) => {
    const cust = customers.find(c => c.id.toString() === v);
    if (cust) {
      if (cust.observation && cust.observation.trim() !== "") {
        setCustomerAlertObservation(cust.observation);
        setAlertCustomerName(`${cust.name || ""} ${cust.first_name || ""}`.trim());
      }
      setClientType(cust.type);
      const isIndividual = cust.type === 'individual';
      
      const driverInfo = isIndividual ? {
        customer_name: `${cust.first_name || ""} ${cust.name || ""}`.trim(),
        customer_phone: cust.phone || "",
        customer_id_type: cust.id_type || "CIN",
        customer_id_number: cust.id_number || "",
        customer_id_issued_date: cust.id_issued_date || "",
        customer_id_issued_at: cust.id_issued_place || "",
        customer_birth_date: cust.birth_date || "",
        customer_birth_place: cust.birth_place || "",
        customer_address: cust.address || "",
        customer_profession: cust.profession || "",
        customer_license_number: cust.license_number || "",
        customer_license_issued_date: cust.license_issued_date || "",
        customer_license_issued_at: cust.license_issued_place || "",
      } : {
        customer_name: cust.name || "",
        customer_phone: cust.phone || "",
        customer_id_type: "CIN",
        customer_id_number: cust.id_number || "",
        customer_id_issued_date: cust.id_issued_date || "",
        customer_id_issued_at: cust.id_issued_place || "",
        customer_birth_date: "",
        customer_birth_place: "",
        customer_address: cust.address || "",
        customer_profession: "",
        customer_license_number: "",
        customer_license_issued_date: "",
        customer_license_issued_at: "",
      };

      setNewRental(prev => ({
        ...prev,
        customer_id: v,
        customer_type: cust.type,
        is_client_first_driver: isIndividual,
        // If it's a company, we must clear primary driver fields as they must select an individual
        ...(cust.type === 'company' ? { driver_id: "" } : {}),
        ...driverInfo
      }));
    }
  };

  const handlePrimaryDriverSelect = (v: string) => {
    // Only allow individual customers as drivers
    const cust = customers.find(c => c.id.toString() === v && c.type === 'individual');
    if (cust) {
      // Prevent selecting same as second driver
      if (v === newRental.second_driver_id) {
        toast.error("Le conducteur principal ne peut pas être le même que le deuxième conducteur.");
        return;
      }

      if (cust.observation && cust.observation.trim() !== "") {
        setCustomerAlertObservation(cust.observation);
        setAlertCustomerName(`${cust.name || ""} ${cust.first_name || ""}`.trim());
      }

      setNewRental(prev => {
        const isCorp = clientType === 'company';
        const companyCust = isCorp ? customers.find(c => c.id.toString() === prev.customer_id?.toString()) : null;

        return {
          ...prev,
          driver_id: v,
          customer_name: isCorp && companyCust ? companyCust.name : `${cust.first_name || ""} ${cust.name || ""}`.trim(),
          customer_phone: isCorp && companyCust ? companyCust.phone || "" : cust.phone || "",
          customer_id_type: isCorp && companyCust ? companyCust.id_type || "CIN" : cust.id_type || "CIN",
          customer_id_number: isCorp && companyCust ? companyCust.id_number || "" : cust.id_number || "",
          customer_id_issued_date: isCorp && companyCust ? companyCust.id_issued_date || "" : cust.id_issued_date || "",
          customer_id_issued_at: isCorp && companyCust ? companyCust.id_issued_place || "" : cust.id_issued_place || "",
          customer_birth_date: isCorp ? "" : cust.birth_date || "",
          customer_birth_place: isCorp ? "" : cust.birth_place || "",
          customer_address: isCorp && companyCust ? companyCust.address || "" : cust.address || "",
          customer_license_number: cust.license_number || "",
          customer_license_issued_date: cust.license_issued_date || "",
          customer_license_issued_at: cust.license_issued_place || "",
        };
      });
    }
  };

  const handleSecondDriverSelect = (v: string) => {
    // Only allow individual customers as drivers
    const cust = customers.find(c => c.id.toString() === v && c.type === 'individual');
    if (cust) {
      // Prevent selecting same as primary driver
      const primaryId = newRental.is_client_first_driver ? newRental.customer_id : newRental.driver_id;
      if (v === primaryId) {
        toast.error("Le deuxième conducteur ne peut pas être le même que le conducteur principal.");
        return;
      }

      if (cust.observation && cust.observation.trim() !== "") {
        setCustomerAlertObservation(cust.observation);
        setAlertCustomerName(`${cust.name || ""} ${cust.first_name || ""}`.trim());
      }

      setNewRental(prev => ({
        ...prev,
        second_driver_id: v,
        second_driver_name: `${cust.first_name || ""} ${cust.name || ""}`.trim(),
        second_driver_phone: cust.phone || "",
        second_driver_id_number: cust.id_number || "",
        second_driver_id_issued_date: cust.id_issued_date || "",
        second_driver_id_issued_at: cust.id_issued_place || "",
        second_driver_birth_date: cust.birth_date || "",
        second_driver_birth_place: cust.birth_place || "",
        second_driver_address: cust.address || "",
        second_driver_profession: cust.profession || "",
        second_driver_license_number: cust.license_number || "",
        second_driver_license_issued_date: cust.license_issued_date || "",
        second_driver_license_issued_at: cust.license_issued_place || "",
      }));
    }
  };

  const getAutoRentalDays = (rentalData: any) => {
    if (!rentalData || !rentalData.start_date || !rentalData.end_date) return 0;
    const calendarDays = differenceInDays(new Date(rentalData.end_date), new Date(rentalData.start_date));
    
    const [startH, startM] = (rentalData.departure_time || "08:00").split(":").map(Number);
    const [endH, endM] = (rentalData.return_time || "08:00").split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const exceedsByOneHour = (endMinutes - startMinutes) >= 60;

    let rentalDays = calendarDays;
    if (calendarDays === 0) {
      // Same-day rental
      rentalDays = exceedsByOneHour ? 2 : 1;
    } else {
      // Multi-day rental
      rentalDays = exceedsByOneHour ? calendarDays + 1 : calendarDays;
    }
    return rentalDays;
  };

  const calculateTotalPrice = (rentalData = newRental) => {
    if (!rentalData || !rentalData.start_date || !rentalData.end_date) return "0.000";
    
    let rentalDays = 1;
    if (rentalData.is_rental_days_overridden && rentalData.rental_days !== undefined && rentalData.rental_days !== null && rentalData.rental_days !== "") {
      rentalDays = parseInt(rentalData.rental_days.toString()) || 1;
    } else {
      rentalDays = getAutoRentalDays(rentalData);
    }
    
    const dailyPrice = parseFloat(rentalData.daily_price?.toString() || "0");
    const basePrice = rentalDays * dailyPrice;
    
    // Additional charges (Frais supplémentaires): 2 DT per day as requested by the contract
    const other = 2.0 * rentalDays;
    const vatRate = parseFloat(rentalData.vat?.toString() || "0") / 100;
    
    // Stamp Duty (Timbre) is fixed to 1 DT
    const stampCalculated = 1.0;
    
    const subtotal = basePrice + other;
    const total = subtotal + (subtotal * vatRate) + stampCalculated;
    
    return isNaN(total) ? "0.000" : total.toFixed(3);
  };

  const validate8Digits = (value: string) => {
    return /^\d{8}$/.test(value);
  };

  const getRentalWithDriverDetails = (r: any) => {
    if (!r) return r;
    const isCorp = r.customer_type === 'company' || (r.customer_id && customers.find(c => c.id.toString() === r.customer_id.toString())?.type === 'company');
    const driverId = r.driver_id;
    
    let result = { ...r };
    if (r.customer_id) {
      const cust = customers.find(c => c.id.toString() === r.customer_id.toString());
      if (cust) {
        result.customer_firstname = cust.first_name || "";
        result.customer_lastname = cust.name || "";
        if (!isCorp) {
          result.customer_name = `${cust.first_name || ""} ${cust.name || ""}`.trim();
        }
      }
    }

    if (isCorp) {
      const baseResult = {
        ...result,
        customer_type: 'company'
      };
      if (driverId) {
        const driverCust = customers.find(c => c.id.toString() === driverId.toString());
        if (driverCust) {
          return {
            ...baseResult,
            driver_name: `${driverCust.first_name || ""} ${driverCust.name || ""}`.trim(),
            driver_firstname: driverCust.first_name || "",
            driver_lastname: driverCust.name || "",
            driver_phone: driverCust.phone || "",
            driver_id_number: driverCust.id_number || "",
            driver_id_issued_date: driverCust.id_issued_date || "",
            driver_id_issued_at: driverCust.id_issued_place || "",
            driver_birth_date: driverCust.birth_date || "",
            driver_birth_place: driverCust.birth_place || "",
            driver_address: driverCust.address || "",
            driver_profession: driverCust.profession || "",
            driver_license_number: driverCust.license_number || "",
            driver_license_issued_date: driverCust.license_issued_date || "",
            driver_license_issued_at: driverCust.license_issued_place || "",
          };
        }
      }
      return baseResult;
    } else {
      if (driverId) {
        const driverCust = customers.find(c => c.id.toString() === driverId.toString());
        if (driverCust) {
          return {
            ...result,
            driver_name: `${driverCust.first_name || ""} ${driverCust.name || ""}`.trim(),
            driver_firstname: driverCust.first_name || "",
            driver_lastname: driverCust.name || "",
            driver_phone: driverCust.phone || "",
            driver_id_number: driverCust.id_number || "",
            driver_id_issued_date: driverCust.id_issued_date || "",
            driver_id_issued_at: driverCust.id_issued_place || "",
            driver_birth_date: driverCust.birth_date || "",
            driver_birth_place: driverCust.birth_place || "",
            driver_address: driverCust.address || "",
            driver_profession: driverCust.profession || "",
            driver_license_number: driverCust.license_number || "",
            driver_license_issued_date: driverCust.license_issued_date || "",
            driver_license_issued_at: driverCust.license_issued_place || "",
          };
        }
      }
    }
    return result;
  };

  const validateRentalData = (data: any) => {
    const isAr = i18n.language === "ar";
    const isEn = i18n.language === "en";

    const getMsg = (fr: string, en: string, ar: string) => {
      if (isAr) return ar;
      if (isEn) return en;
      return fr;
    };

    if (!data.customer_id) {
      toast.error(getMsg("Veuillez sélectionner un client contractant.", "Please select a contracting customer.", "يرجى اختيار العميل المتعاقد."));
      return false;
    }

    if (!data.driver_id && !data.is_client_first_driver) {
      toast.error(getMsg("Veuillez sélectionner un conducteur principal.", "Please select a primary driver.", "يرجى اختيار السائق الرئيسي."));
      return false;
    }

    // Validate that the primary driver and second driver are not the same!
    const firstDriverId = data.is_client_first_driver ? data.customer_id?.toString() : data.driver_id?.toString();
    const secondDriverId = data.second_driver_id?.toString();

    const hasSecondDriver = data.has_second_driver || (secondDriverId && secondDriverId !== "none" && secondDriverId !== "") || !!data.second_driver_name;

    if (hasSecondDriver) {
      if (firstDriverId && secondDriverId && secondDriverId !== "none" && firstDriverId === secondDriverId) {
        toast.error(getMsg(
          "Le 1er conducteur et le 2ème conducteur ne peuvent pas être la même personne.",
          "The 1st driver and the 2nd driver cannot be the same person.",
          "لا يمكن أن يكون السائق الأول والسائق الثاني نفس الشخص."
        ));
        return false;
      }

      // Check by manual fields as well
      const primaryDriverCust = customers.find(c => c.id.toString() === data.driver_id?.toString());
      const firstDriverName = data.is_client_first_driver 
        ? data.customer_name 
        : (primaryDriverCust ? `${primaryDriverCust.first_name || ""} ${primaryDriverCust.name || ""}`.trim() : "");
      const secondDriverName = data.second_driver_name;

      if (firstDriverName && secondDriverName && firstDriverName.trim().toLowerCase() === secondDriverName.trim().toLowerCase() && firstDriverName.trim() !== "") {
        toast.error(getMsg(
          "Le nom du 1er conducteur et du 2ème conducteur ne peuvent pas être identiques.",
          "The 1st driver and 2nd driver names cannot be identical.",
          "لا يمكن أن يكون اسم السائق الأول والسائق الثاني متطابقين."
        ));
        return false;
      }

      const firstDriverCIN = data.is_client_first_driver 
        ? data.customer_id_number 
        : (primaryDriverCust?.id_number || "");
      const secondDriverCIN = data.second_driver_id_number;

      if (firstDriverCIN && secondDriverCIN && firstDriverCIN.trim().toLowerCase() === secondDriverCIN.trim().toLowerCase() && firstDriverCIN.trim() !== "") {
        toast.error(getMsg(
          "Le CIN/Passeport du 1er conducteur et du 2ème conducteur ne peuvent pas être identiques.",
          "The 1st driver and 2nd driver CIN/Passport cannot be identical.",
          "لا يمكن أن يكون رقم CIN/جواز السفر للسائق الأول والسائق الثاني متطابقين."
        ));
        return false;
      }

      const firstDriverPhone = data.is_client_first_driver 
        ? data.customer_phone 
        : (primaryDriverCust?.phone || "");
      const secondDriverPhone = data.second_driver_phone;

      if (firstDriverPhone && secondDriverPhone && firstDriverPhone.trim() === secondDriverPhone.trim() && firstDriverPhone.trim() !== "") {
        toast.error(getMsg(
          "Le téléphone du 1er conducteur et du 2ème conducteur ne peuvent pas être identiques.",
          "The 1st driver and 2nd driver phone numbers cannot be identical.",
          "لا يمكن أن يكون رقم هاتف السائق الأول والسائق الثاني متطابقين."
        ));
        return false;
      }
    }

    /* Second driver is now optional as requested */
    /*
    if (!data.second_driver_id) {
      toast.error(getMsg("Veuillez sélectionner obligatoirement un deuxième conducteur.", "Please select a second driver (mandatory).", "يرجى اختيار السائق الثاني (إلزامي)."));
      return false;
    }
    */

    // "Il est nécessaire de choisir deux conducteurs" - If the user meant always 2, or just IF has_second_driver.
    // Given the prompt, I'll assume they meant if they want a 2nd, but the prompt says "Il est nécessaire de choisir deux"
    // I will enforce 2 drivers if has_second_driver is checked, which is standard. 
    // Wait, the prompt says "Il est nécessaire de choisir deux" in a way that sounds mandatory.
    // But usually one driver is enough. I will keep has_second_driver as a toggle but emphasize selection.

    if (!data.car_id || (!data.branch_id && !data.departure_place)) {
      toast.error(getMsg("Veuillez sélectionner un véhicule et choisir un local de départ.", "Please select a vehicle and choose a departure branch.", "يرجى اختيار السيارة واختيار فرع المغادرة."));
      return false;
    }

    if (!data.departure_time) {
      toast.error(getMsg("L'heure de départ est obligatoire.", "Departure time is mandatory.", "وقت المغادرة إلزامي."));
      return false;
    }

    if (!data.start_date || !data.end_date) {
      toast.error(getMsg("Veuillez remplir les dates de location.", "Please fill rental dates.", "يرجى ملء تواريخ الإيجار."));
      return false;
    }

    const startDateTime = new Date(`${data.start_date}T${data.departure_time || "00:00"}`);
    const endDateTime = new Date(`${data.end_date}T${data.return_time || "00:00"}`);

    if (data.start_date === data.end_date) {
      if (data.return_time <= data.departure_time) {
        toast.error(getMsg("L'heure de retour doit être plus tard que l'heure de départ pour une location le même jour.", "Return time must be later than departure time for same-day rentals.", "يجب أن يكون وقت العودة متأخرًا عن وقت المغادرة للإيجارات في نفس اليوم."));
        return false;
      }
    } else if (endDateTime <= startDateTime) {
      toast.error(getMsg("La date/heure de retour doit être après la date/heure de départ.", "Return date/time must be after departure date/time.", "يجب أن يكون تاريخ/وقت العودة بعد تاريخ/وقت المغادرة."));
      return false;
    }

    // Numerical validations
    if (data.daily_price !== undefined && data.daily_price !== "" && (isNaN(Number(data.daily_price)) || Number(data.daily_price) < 0)) {
      toast.error(getMsg("Le prix par jour doit être un nombre positif.", "Daily price must be a positive number.", "يجب أن يكون السعر اليومي رقمًا موجبًا."));
      return false;
    }

    if (data.deposit_amount !== undefined && data.deposit_amount !== "" && (isNaN(Number(data.deposit_amount)) || Number(data.deposit_amount) < 0)) {
      toast.error(getMsg("Le montant de la caution doit être un nombre positif.", "Deposit amount must be a positive number.", "يجب أن يكون مبلغ التأمين رقمًا موجبًا."));
      return false;
    }

    if (data.amount_paid !== undefined && data.amount_paid !== "" && (isNaN(Number(data.amount_paid)) || Number(data.amount_paid) < 0)) {
      toast.error(getMsg("Le montant payé doit être un nombre positif.", "Amount paid must be a positive number.", "يجب أن يكون المبلغ المدفوع رقمًا موجبًا."));
      return false;
    }

    if (data.km_depart === undefined || data.km_depart === "" || isNaN(Number(data.km_depart)) || Number(data.km_depart) < 0) {
      toast.error(getMsg("Le kilométrage de départ est obligatoire et doit être un nombre positif.", "Starting mileage is mandatory and must be a positive number.", "عداد المسافة عند البدء إلزامي ويجب أن يكون رقمًا موجبًا."));
      return false;
    }

    // Additional validation for modification: prevent emptying required fields
    if (data.daily_price === undefined || data.daily_price === "" || isNaN(Number(data.daily_price)) || Number(data.daily_price) <= 0) {
      toast.error(getMsg("Le prix journalier est obligatoire et doit être supérieur à 0.", "Daily price is mandatory and must be greater than 0.", "السعر اليومي إلزامي ويجب أن يكون أكبر من 0."));
      return false;
    }

    return true;
  };

  const handleGenerateInvoiceSingle = (rental: any) => {
    // find customer for this rental
    const customer = (rental.customer_id ? customers.find(c => c.id.toString() === rental.customer_id.toString()) : null) || {
      name: rental.customer_name,
      first_name: "",
      phone: rental.customer_phone,
      id_number: rental.customer_id_number,
      address: rental.customer_address,
      type: rental.customer_type || (rental.customer_id_number && rental.customer_id_number.length > 0 ? 'individual' : 'company')
    };
    
    try {
      let rentalsToInvoice = [rental];
      if (rental.lease_group_number) {
        // Find all other rentals with the same lease_group_number and sort by suffix
        const groupRentals = rentals.filter(r => r.lease_group_number === rental.lease_group_number);
        if (groupRentals.length > 0) {
          rentalsToInvoice = groupRentals;
        }
        rentalsToInvoice.sort((a, b) => (a.lease_suffix || "").localeCompare(b.lease_suffix || ""));
      }
      
      generateInvoicePDF(customer, rentalsToInvoice, settings);
      toast.success("Facture générée avec succès");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Erreur lors de la génération de la facture");
    }
  };

  const handleAddRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    if (!validateRentalData(newRental)) return;

    setSubmitting(true);
    try {
      const total_price_str = calculateTotalPrice();
      const total_price = parseFloat(total_price_str.toString());
      
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isFuture = newRental.start_date > todayStr;
      
      let rentalDays = 1;
      if (newRental.is_rental_days_overridden && newRental.rental_days !== undefined && newRental.rental_days !== null && newRental.rental_days !== "") {
        rentalDays = parseInt(newRental.rental_days.toString()) || 1;
      } else {
        rentalDays = getAutoRentalDays(newRental);
      }
      const stampCalculated = 1.0;

      const rentalData = { 
        ...newRental, 
        rental_days: rentalDays,
        customer_type: clientType,
        total_price, 
        status: isFuture ? 'scheduled' : 'active',
        customer_id: newRental.customer_id ? parseInt(newRental.customer_id) : null,
        driver_id: newRental.is_client_first_driver 
          ? (newRental.customer_id ? parseInt(newRental.customer_id) : null) 
          : (newRental.driver_id ? parseInt(newRental.driver_id) : null),
        second_driver_id: newRental.second_driver_id ? parseInt(newRental.second_driver_id) : null,
        customer_id_type: newRental.customer_id_type,
        customer_id_number: newRental.customer_id_number,
        customer_id_issued_date: newRental.customer_id_issued_date,
        car_id: newRental.car_id ? parseInt(newRental.car_id) : 1,
        branch_id: newRental.branch_id ? parseInt(newRental.branch_id) : (user.branch_id ? parseInt(user.branch_id) : 1),
        daily_price: parseFloat(newRental.daily_price || "0"),
        deposit: parseFloat(newRental.deposit || "0"),
        current_mileage: parseInt(newRental.current_mileage || "0"),
        km_depart: newRental.km_depart ? parseInt(newRental.km_depart) : null,
        deposit_amount: newRental.deposit_amount ? parseFloat(newRental.deposit_amount) : null,
        other_charges: 2.0 * rentalDays,
        vat: parseFloat(newRental.vat || "0"),
        stamp_duty: stampCalculated,
        fuel_level: parseInt(newRental.fuel_level?.toString() || "50"),
        amount_paid: parseFloat(newRental.amount_paid || "0"),
        amount_remaining: parseFloat(newRental.amount_remaining || "0"),
        fuel_total_bars: parseInt(newRental.fuel_total_bars || "8"),
        fuel_depart_bars: (newRental.fuel_depart_bars !== undefined && newRental.fuel_depart_bars !== null && newRental.fuel_depart_bars !== "") ? parseInt(newRental.fuel_depart_bars) : null,
        created_by_id: user.id
      };
 
      const resData = await api.createRental(rentalData);
      
      // Update car fuel state
      await api.updateCar(rentalData.car_id, { fuel_current_bars: rentalData.fuel_depart_bars });
      
      toast.success(t("common.success"));
      navigate("/rentals");
      fetchData();
      
      const selectedCarObj = cars.find(c => c.id.toString() === rentalData.car_id.toString());
      if (shouldGenerateContract) {
        generateContractPDF(getRentalWithDriverDetails({ 
          ...rentalData, 
          id: resData.id,
          contract_number: resData.contract_number,
          total_price, 
          brand: selectedCarObj?.brand || "",
          model: selectedCarObj?.model || "",
          registration: selectedCarObj?.registration || "",
          color: selectedCarObj?.color || "",
          year: selectedCarObj?.year || ""
        }), settings);
      }
      setNewRental(initialRentalState);
    } catch (error) {
      console.error("Error creating rental:", error);
      toast.error(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateRentalData(editingRental)) return;

    setSubmitting(true);
    try {
      const total_price_str = calculateTotalPrice(editingRental);
      const total_price = parseFloat(total_price_str.toString()) || 0;
      
      let rentalDays = 1;
      if (editingRental.is_rental_days_overridden && editingRental.rental_days !== undefined && editingRental.rental_days !== null && editingRental.rental_days !== "") {
        rentalDays = parseInt(editingRental.rental_days.toString()) || 1;
      } else {
        rentalDays = getAutoRentalDays(editingRental);
      }
      const stampCalculated = 1.0;

      const updateData = { 
        ...editingRental, 
        rental_days: rentalDays,
        total_price,
        customer_id: editingRental.customer_id ? parseInt(editingRental.customer_id.toString()) : null,
        driver_id: editingRental.is_client_first_driver 
          ? (editingRental.customer_id ? parseInt(editingRental.customer_id.toString()) : null) 
          : (editingRental.driver_id ? parseInt(editingRental.driver_id.toString()) : null),
        second_driver_id: editingRental.second_driver_id ? parseInt(editingRental.second_driver_id.toString()) : null,
        customer_id_type: editingRental.customer_id_type || "",
        customer_id_number: editingRental.customer_id_number || "",
        customer_id_issued_date: editingRental.customer_id_issued_date || "",
        car_id: editingRental.car_id ? parseInt(editingRental.car_id.toString()) : 1,
        branch_id: editingRental.branch_id ? parseInt(editingRental.branch_id.toString()) : (user.branch_id ? parseInt(user.branch_id) : 1),
        daily_price: parseFloat(editingRental.daily_price?.toString() || "0") || 0,
        deposit: parseFloat(editingRental.deposit?.toString() || "0") || 0,
        current_mileage: parseInt(editingRental.current_mileage?.toString() || "0") || 0,
        km_depart: editingRental.km_depart ? parseInt(editingRental.km_depart.toString()) : null,
        deposit_amount: editingRental.deposit_amount ? parseFloat(editingRental.deposit_amount.toString()) : null,
        other_charges: 2.0 * rentalDays,
        vat: parseFloat(editingRental.vat?.toString() || "0") || 0,
        stamp_duty: stampCalculated || 0,
        fuel_level: parseInt(editingRental.fuel_level?.toString() || "50") || 50,
        amount_paid: parseFloat(editingRental.amount_paid?.toString() || "0") || 0,
        amount_remaining: parseFloat(editingRental.amount_remaining?.toString() || "0") || 0,
        fuel_total_bars: parseInt(editingRental.fuel_total_bars?.toString() || "8") || 8,
        fuel_depart_bars: (editingRental.fuel_depart_bars !== undefined && editingRental.fuel_depart_bars !== null && editingRental.fuel_depart_bars !== "") ? parseInt(editingRental.fuel_depart_bars.toString()) : null,
      };

      await api.updateRental(editingRental.id, updateData);
      toast.success(t("common.success"));
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating rental:", error);
      toast.error(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnCar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!returningRental.return_date || !returningRental.return_mileage) {
      toast.error(i18n.language === "ar" ? "يرجى ملء تاريخ العودة والمسافة المقطوعة." : (i18n.language === "en" ? "Please fill return date and mileage." : "Veuillez remplir la date de retour et le kilométrage."));
      return;
    }

    if (new Date(returningRental.return_date) < new Date(selectedRental.start_date)) {
      toast.error(i18n.language === "ar" ? "تاريخ العودة لا يمكن أن يكون قبل تاريخ البدء." : (i18n.language === "en" ? "Return date cannot be before start date." : "La date de retour ne peut pas être avant la date de départ."));
      return;
    }

    const startKm = Number(selectedRental.km_depart || selectedRental.current_mileage);
    if (Number(returningRental.return_mileage) < startKm) {
        toast.error(i18n.language === "ar" ? "يجب أن يكون كيلومتر العودة أكبر من كيلومتر الذهاب." : (i18n.language === "en" ? "Return KM must be greater than start KM." : "Le KM de retour doit être supérieur au KM de départ."));
        return;
    }

    const days = Math.max(1, differenceInDays(new Date(returningRental.return_date), new Date(selectedRental.start_date)));
    const allowance = selectedRental.km_allowance || 280;
    const allowedKm = days * allowance;
    const actualKm = Number(returningRental.return_mileage) - Number(selectedRental.km_depart || selectedRental.current_mileage);
    const excessKm = Math.max(0, actualKm - allowedKm);
    const excessPrice = selectedRental.excess_km_price || 5;
    const excessAmount = excessKm * excessPrice;

    const damageDeduction = returningRental.is_damaged ? parseFloat(returningRental.damage_deduction || "0") : 0;
    const initialRemaining = Math.max(0, parseFloat(selectedRental.amount_remaining || "0"));
    const totalDueAtReturn = initialRemaining + excessAmount + damageDeduction;

    if (totalDueAtReturn > 0 && !confirmReturnPayment) {
      toast.error(
        i18n.language === "ar" 
          ? "يجب تأكيد دفع المبلغ المتبقي المستحق عند العودة." 
          : "Veuillez confirmer le règlement du montant restant dû obligatoire."
      );
      return;
    }

    try {
      const excessAmount = excessKm * excessPrice;

      await api.returnCar(selectedRental.id, {
        ...returningRental,
        km_retour: returningRental.return_mileage,
        km_parcouru: actualKm,
        km_factures: excessKm,
        excess_amount: excessAmount,
        fuel_return_bars: parseInt(returningRental.fuel_return_bars || "0"),
        is_damaged: returningRental.is_damaged ? 1 : 0,
        damage_deduction: parseFloat(returningRental.damage_deduction || "0")
      });

      // Update car mileage and fuel
      await api.updateCar(selectedRental.car_id, { 
        mileage: parseInt(returningRental.return_mileage),
        fuel_current_bars: parseInt(returningRental.fuel_return_bars || "0")
      });

      toast.success("Voiture retournée avec succès. Supplément KM: " + excessAmount.toFixed(2) + " DT");
      setIsReturnOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const handleExtendRental = (rental: any) => {
    setSelectedExtendRental(rental);
    setExtendData({
      end_date: "",
      return_time: rental.return_time || "08:00",
      return_place: rental.return_place || "",
      prolongation_place: rental.return_place || "",
      new_payment: "0",
      new_payment_mode: "Espèces"
    });
    setIsExtendOpen(true);
  };

  const calculateExtendPrice = () => {
    if (!selectedExtendRental || !extendData.end_date) return { total: 0, days: 0, stamp_duty: 0, diff: 0 };
    
    const days = differenceInDays(new Date(extendData.end_date), new Date(selectedExtendRental.start_date));
    const rentalDays = days <= 0 ? 1 : days;
    
    const basePrice = rentalDays * parseFloat(selectedExtendRental.daily_price || "0");
    
    // Additional charges (Frais supplémentaires): 2 DT per day as requested by the contract
    const other = 2.0 * rentalDays;
    const vatRate = parseFloat(selectedExtendRental.vat || "0") / 100;
    
    // Stamp Duty (Timbre) is fixed to 1 DT
    const stampCalculated = 1.0;
    
    const subtotal = basePrice + other;
    const total = subtotal + (subtotal * vatRate) + stampCalculated;
    
    const currentTotal = parseFloat(selectedExtendRental.total_price || "0");
    const diff = total - currentTotal;
    
    return {
      total: parseFloat(total.toFixed(3)),
      days: rentalDays,
      stamp_duty: stampCalculated,
      diff: parseFloat(diff.toFixed(3))
    };
  };

  const handleConfirmExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExtendRental || !extendData.end_date) return;
    
    // Validate end date is after start date
    if (new Date(extendData.end_date) <= new Date(selectedExtendRental.start_date)) {
      toast.error("La nouvelle date de retour doit être après la date de départ.");
      return;
    }
    
    try {
      const { total, stamp_duty, days } = calculateExtendPrice();
      const addedPayment = parseFloat(extendData.new_payment || "0") || 0;
      const currentPaid = parseFloat(selectedExtendRental.amount_paid || "0") || 0;
      const newAmountPaid = parseFloat((currentPaid + addedPayment).toFixed(3));
      
      const updateData = {
        end_date: extendData.end_date,
        return_time: extendData.return_time,
        return_place: extendData.return_place,
        
        // Prolongation fields for PDF
        prolongation_date: extendData.end_date,
        prolongation_place: extendData.prolongation_place || extendData.return_place,
        prolongation_time: extendData.return_time,
        
        // Price updates
        total_price: total,
        stamp_duty: stamp_duty,
        other_charges: 2.0 * days,
        amount_paid: newAmountPaid,
        amount_remaining: parseFloat((total - newAmountPaid).toFixed(3)),
        payment_mode: addedPayment > 0 ? extendData.new_payment_mode : (selectedExtendRental.payment_mode || "Espèces")
      };
      
      await api.updateRental(selectedExtendRental.id, updateData);
      toast.success("Location prolongée avec succès !");
      setIsExtendOpen(false);
      fetchData();
      
      // Generate and download/display updated contract PDF
      const updatedRentalFull = await api.getRental(selectedExtendRental.id);
      generateContractPDF(getRentalWithDriverDetails(updatedRentalFull), settings);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la prolongation");
    }
  };

  const handleDeleteRental = async () => {
    try {
      await api.deleteRental(selectedRental.id);
      toast.success(t("common.success"));
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    }
  };

  const triggerActivation = (rental: any) => {
    setSelectedRental(rental);
    
    // Find matching car's default metrics if possible (safe conversion to string)
    const currentCar = cars.find(c => c.id.toString() === rental.car_id?.toString());
    const startMileage = rental.km_depart?.toString() || currentCar?.mileage?.toString() || rental.current_mileage?.toString() || "0";
    const totalFuel = currentCar?.fuel_total_bars?.toString() || rental.fuel_total_bars?.toString() || "8";
    const actualClientType = customers.find(c => c.id.toString() === rental.customer_id?.toString())?.type || rental.customer_type || "individual";
    const initialDriverId = rental.driver_id?.toString() || (actualClientType === 'individual' ? rental.customer_id?.toString() : "") || "";

    setActivationRental({
      ...rental,
      id: rental.id,
      car_id: rental.car_id?.toString() || "",
      start_date: rental.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: rental.end_date || format(new Date(), 'yyyy-MM-dd'),
      departure_time: rental.departure_time || "08:00",
      return_time: rental.return_time || "08:00",
      customer_id: rental.customer_id?.toString() || "",
      driver_id: initialDriverId,
      second_driver_id: rental.second_driver_id?.toString() || "",
      customer_type: actualClientType,
      is_client_first_driver: rental.is_client_first_driver !== undefined ? rental.is_client_first_driver : true,
      km_depart: startMileage,
      fuel_depart_bars: "0", // Start fully empty as requested
      fuel_total_bars: totalFuel,
      daily_price: rental.daily_price !== undefined && rental.daily_price !== null ? rental.daily_price.toString() : "",
      other_charges: rental.other_charges?.toString() || "0",
      vat: rental.vat?.toString() || "0",
      deposit_amount: rental.deposit_amount?.toString() || "",
      payment_mode: rental.payment_mode || "Espèces",
      amount_paid: rental.amount_paid?.toString() || "0",
      amount_remaining: rental.amount_remaining?.toString() || "0",
      state_photos: rental.state_photos || []
    });
    setIsActivationOpen(true);
  };

  const calculateActivationPrice = () => {
    if (!activationRental || !activationRental.start_date || !activationRental.end_date) return { total: 0, days: 0, stamp_duty: 0 };
    const days = differenceInDays(new Date(activationRental.end_date), new Date(activationRental.start_date));
    const rentalDays = days <= 0 ? 1 : days;
    
    let dailyPrice = parseFloat(activationRental.daily_price || "0");
    if (isNaN(dailyPrice)) dailyPrice = 0;
    
    const basePrice = rentalDays * dailyPrice;
    
    // Additional charges (Frais supplémentaires): 2 DT per day as requested by the contract
    const other = 2.0 * rentalDays;
    
    let vatRate = parseFloat(activationRental.vat || "0") / 100;
    if (isNaN(vatRate)) vatRate = 0;
    
    // Stamp Duty is fixed to 1 DT
    const stampCalculated = 1.0;
    const subtotal = basePrice + other;
    const total = subtotal + (subtotal * vatRate) + stampCalculated;
    return {
      days: rentalDays,
      total: isNaN(total) ? 0 : parseFloat(total.toFixed(3)),
      stamp_duty: stampCalculated
    };
  };

  const handleConfirmActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationRental) return;

    if (!activationRental.car_id || !activationRental.start_date || !activationRental.end_date) {
      toast.error("Veuillez sélectionner un véhicule et les dates.");
      return;
    }

    const primaryId = activationRental.driver_id;
    const secondId = activationRental.second_driver_id;
    if (primaryId && secondId && secondId !== "none" && secondId !== "" && primaryId.toString() === secondId.toString()) {
      toast.error("Le premier conducteur et le deuxième conducteur ne peuvent pas être la même personne.");
      return;
    }

    if (!isCurrentCarAvailableForActivation) {
      toast.error("Le véhicule sélectionné n'est pas disponible pour ces dates (déjà réservé pour d'autres locations). Veuillez corriger les dates ou choisir un véhicule disponible.");
      return;
    }

    try {
      const { total, stamp_duty, days } = calculateActivationPrice();
      const paid = parseFloat(activationRental.amount_paid || "0");
      const remaining = parseFloat((total - paid).toFixed(3));

      // Retrieve customer/driver specifics to sync values inside the database
      const selectedDriverId = activationRental.driver_id ? parseInt(activationRental.driver_id) : null;
      
      const updatedData = {
        end_date: activationRental.end_date,
        start_date: activationRental.start_date,
        departure_time: activationRental.departure_time,
        return_time: activationRental.return_time,
        car_id: parseInt(activationRental.car_id),
        branch_id: activationRental.branch_id,
        driver_id: selectedDriverId,
        second_driver_id: activationRental.second_driver_id && activationRental.second_driver_id !== "none" ? parseInt(activationRental.second_driver_id) : null,
        km_depart: parseInt(activationRental.km_depart || "0"),
        fuel_depart_bars: parseInt(activationRental.fuel_depart_bars || "8"),
        fuel_total_bars: parseInt(activationRental.fuel_total_bars || "8"),
        daily_price: parseFloat(activationRental.daily_price || "0"),
        other_charges: 2.0 * days,
        vat: parseFloat(activationRental.vat || "0"),
        deposit_amount: activationRental.deposit_amount ? parseFloat(activationRental.deposit_amount) : null,
        payment_mode: activationRental.payment_mode,
        amount_paid: paid,
        amount_remaining: remaining,
        total_price: total,
        stamp_duty: stamp_duty,
        status: 'active'
      };

      await api.updateRental(activationRental.id, updatedData);

      // Synchronize the car metrics
      await api.updateCar(updatedData.car_id, {
        mileage: updatedData.km_depart,
        fuel_current_bars: updatedData.fuel_depart_bars,
        status: 'rented'
      });

      toast.success("Location activée et mise à jour avec succès !");
      setIsActivationOpen(false);
      fetchData();

      // Download PDF contract automatically
      const updatedRentalFull = await api.getRental(activationRental.id);
      generateContractPDF(getRentalWithDriverDetails(updatedRentalFull), settings);
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur d'activation : " + (error.message || "Impossible d'activer."));
    }
  };

  const handleCancelRental = async () => {
    try {
      if (!selectedRental) return;
      await api.updateRental(selectedRental.id, { status: 'cancelled', branch_id: selectedRental.branch_id });
      toast.success("Location annulée avec succès");
      setIsCancelOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    }
  };

  const calculateSwapPrice = (newDailyPrice: string) => {
    if (!selectedRental) return { total: 0, days: 0, subtotal: 0, vat: 0, stamp_duty: 1.0 };
    const days = differenceInDays(new Date(selectedRental.end_date), new Date(selectedRental.start_date));
    const rentalDays = days <= 0 ? 1 : days;
    const dailyPrice = parseFloat(newDailyPrice || "0") || 0;
    const basePrice = rentalDays * dailyPrice;
    const other = 2.0 * rentalDays;
    const vatRate = parseFloat(selectedRental.vat?.toString() || "0") / 100;
    const stampCalculated = 1.0;
    const subtotal = basePrice + other;
    const total = subtotal + (subtotal * vatRate) + stampCalculated;
    return {
      days: rentalDays,
      total: isNaN(total) ? 0 : parseFloat(total.toFixed(3)),
      subtotal,
      vat: subtotal * vatRate,
      stamp_duty: stampCalculated
    };
  };

  const handleSwapCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swappingData.new_car_id || !swappingData.old_car_return_mileage || !swappingData.new_car_start_mileage) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      const { total } = calculateSwapPrice(swappingData.daily_price);
      const paid = parseFloat(selectedRental?.amount_paid || "0") || 0;
      const addedPayment = parseFloat(swappingData.new_payment || "0") || 0;
      const newPaid = parseFloat((paid + addedPayment).toFixed(3));
      const remaining = parseFloat((total - newPaid).toFixed(3));

      const payload = {
        ...swappingData,
        daily_price: parseFloat(swappingData.daily_price) || 0,
        total_price: total,
        amount_paid: newPaid,
        amount_remaining: remaining,
        payment_mode: addedPayment > 0 ? swappingData.new_payment_mode : (selectedRental?.payment_mode || "Espèces")
      };

      await api.swapCar(selectedRental.id, payload);
      toast.success("Véhicule changé avec succès");
      setIsSwapOpen(false);
      
      // Fetch updated rental immediately and generate contract PDF
      const updatedRental = await api.getRental(selectedRental.id);
      generateContractPDF(getRentalWithDriverDetails(updatedRental), settings);

      fetchData();
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    }
  };

  const filteredRentals = rentals.filter(r => {
    // 1. Status Filter (Combines legacy tabs/selects with advanced section filters)
    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = r.status === statusFilter;
    } else if (filterStatus !== "all") {
      if (filterStatus === "non_cloture") {
        matchesStatus = r.status === "active" || r.status === "scheduled";
      } else if (filterStatus === "cloture" || filterStatus === "completed") {
        matchesStatus = r.status === "completed";
      } else {
        matchesStatus = r.status === filterStatus;
      }
    }

    // 2. Branch Filter
    const matchesBranch = branchFilter === "all" ? (filterBranchId === "all" || r.branch_id?.toString() === filterBranchId) : r.branch_id?.toString() === branchFilter;
    
    // 3. Payment Filter
    const matchesPayment = paymentFilter === "all" || r.payment_mode === paymentFilter;

    // 4. Date range filter
    let matchesDateRange = true;
    if (filterStartDate) {
      matchesDateRange = matchesDateRange && r.start_date >= filterStartDate;
    }
    if (filterEndDate) {
      matchesDateRange = matchesDateRange && r.end_date <= filterEndDate;
    }

    // 5. Client type filter
    const matchesClientType = filterClientType === "all" || r.customer_type === filterClientType;

    // 6. Client Name filter
    let matchesClientName = true;
    if (realFilterClientName) {
      matchesClientName = (r.customer_name || "").toLowerCase().includes(realFilterClientName.toLowerCase());
    }

    // 7. Client Phone filter
    let matchesClientPhone = true;
    if (filterClientPhone) {
      matchesClientPhone = r.customer_phone && r.customer_phone.includes(filterClientPhone);
    }

    // 8. Specific dropdown user selection
    const matchesSelectedClient = filterSelectedClientId === "all" || r.customer_id?.toString() === filterSelectedClientId;

    // 9. Brand filter
    let matchesCarBrand = true;
    if (filterCarBrand && filterCarBrand !== "all") {
      matchesCarBrand = r.brand && r.brand.toLowerCase() === filterCarBrand.toLowerCase();
    }

    // 10. Model filter
    let matchesCarModel = true;
    if (filterCarModel && filterCarModel !== "all") {
      matchesCarModel = r.model && r.model.toLowerCase() === filterCarModel.toLowerCase();
    }

    // 11. Registration filter
    let matchesCarReg = true;
    if (filterCarReg && filterCarReg !== "all") {
      matchesCarReg = r.registration && r.registration.toLowerCase() === filterCarReg.toLowerCase();
    }

    // 12. Departure place filter
    let matchesDeparturePlace = true;
    if (filterDeparturePlace && filterDeparturePlace !== "all") {
      matchesDeparturePlace = r.departure_place && r.departure_place.toLowerCase() === filterDeparturePlace.toLowerCase();
    }

    // 13. Return place filter
    let matchesReturnPlace = true;
    if (filterReturnPlace && filterReturnPlace !== "all") {
      matchesReturnPlace = r.return_place && r.return_place.toLowerCase() === filterReturnPlace.toLowerCase();
    }

    // 14. Main search text
    const matchesSearch = !search ? true : (
      (r.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.brand || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.model || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.registration || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.customer_phone && r.customer_phone.includes(search)) ||
      (r.customer_id_number && r.customer_id_number.includes(search)) ||
      (r.contract_number && r.contract_number.toLowerCase().includes(search.toLowerCase()))
    );

    return matchesStatus && 
           matchesBranch && 
           matchesPayment && 
           matchesDateRange && 
           matchesClientType && 
           matchesClientName && 
           matchesClientPhone && 
           matchesSelectedClient &&
           matchesCarBrand && 
           matchesCarModel && 
           matchesCarReg && 
           matchesDeparturePlace && 
           matchesReturnPlace && 
           matchesSearch;
  });

  const sortedRentals = [...filteredRentals].sort((a, b) => {
    let valA: any = "";
    let valB: any = "";

    switch (sortField) {
      case "customer":
        valA = (a.customer_name || "").toLowerCase();
        valB = (b.customer_name || "").toLowerCase();
        break;
      case "contract":
        valA = (a.contract_number || "").toLowerCase();
        valB = (b.contract_number || "").toLowerCase();
        break;
      case "car":
        valA = `${a.brand || ""} ${a.model || ""}`.toLowerCase();
        valB = `${b.brand || ""} ${b.model || ""}`.toLowerCase();
        break;
      case "registration":
        valA = (a.registration || "").toLowerCase();
        valB = (b.registration || "").toLowerCase();
        break;
      case "branch":
        valA = (a.branch_name || "").toLowerCase();
        valB = (b.branch_name || "").toLowerCase();
        break;
      case "dates":
        valA = new Date(a.start_date || "").getTime();
        valB = new Date(b.start_date || "").getTime();
        break;
      case "duration":
        valA = differenceInDays(new Date(a.end_date), new Date(a.start_date));
        valB = differenceInDays(new Date(b.end_date), new Date(b.start_date));
        break;
      case "price":
        valA = a.total_price || 0;
        valB = b.total_price || 0;
        break;
      case "paid":
        valA = a.amount_paid || 0;
        valB = b.amount_paid || 0;
        break;
      case "remaining":
        valA = (a.total_price || 0) - (a.amount_paid || 0);
        valB = (b.total_price || 0) - (b.amount_paid || 0);
        break;
      case "status":
        valA = (a.status || "").toLowerCase();
        valB = (b.status || "").toLowerCase();
        break;
      default:
        valA = a.id || 0;
        valB = b.id || 0;
        break;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedRentals = sortedRentals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {isAddOpen ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/rentals")} 
              className="h-11 px-4 rounded-xl hover:bg-slate-100"
            >
              <ChevronLeft className="w-6 h-6 mr-2" />
              Retour à la liste
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("rentals.new")}</h1>
          </div>

          <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
            <div className="p-8 border-b bg-slate-50">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <PlusCircle className="w-8 h-8 text-blue-600" />
                {t("rentals.new")}
              </h2>
              <p className="text-slate-500 text-lg font-medium">Remplissez les informations pour créer un nouveau contrat de location.</p>
            </div>

            <form onSubmit={handleAddRental} className="p-8 space-y-12">
              {/* Section: Client */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                  <User className="w-6 h-6 text-blue-600" /> Sélection du Client (Contractant)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Type de Client</Label>
                      <Tabs value={clientType} onValueChange={(v: any) => {
                        setClientType(v);
                        setNewRental(prev => ({ 
                          ...prev, 
                          customer_id: "", 
                          is_client_first_driver: v === 'individual',
                          customer_name: "",
                          customer_phone: "",
                          customer_id_number: "",
                          driver_id: ""
                        }));
                      }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                          <TabsTrigger value="individual" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Particulier</TabsTrigger>
                          <TabsTrigger value="company" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Entreprise</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Choisir le client (Nom, Prénom, CIN...)</Label>
                      <Select 
                        value={newRental.customer_id || ""} 
                        onValueChange={handleCustomerSelect}
                      >
                        <SelectTrigger 
                          className="h-11 rounded-lg text-sm bg-white border-slate-200"
                          showClear={!!newRental.customer_id}
                          onClear={() => {
                            setNewRental({
                              ...newRental,
                              customer_id: "",
                              customer_name: "",
                              customer_phone: "",
                              customer_id_type: "CIN",
                              customer_id_number: "",
                              customer_id_issued_date: "",
                              customer_id_issued_at: "",
                              customer_birth_date: "",
                              customer_birth_place: "",
                              customer_address: "",
                              customer_profession: "",
                              customer_license_number: "",
                              customer_license_issued_date: "",
                              customer_license_issued_at: "",
                              driver_id: ""
                            });
                          }}
                        >
                          <SelectValue placeholder="Rechercher par nom ou pièce d'identité...">
                            {newRental.customer_id && customers.find(c => c.id.toString() === newRental.customer_id.toString()) ? (
                              (() => {
                                const c = customers.find(c => c.id.toString() === newRental.customer_id.toString());
                                return c.type === 'company' ? c.name : `${c.name} ${c.first_name}`;
                              })()
                            ) : null}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[350px]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input 
                              placeholder="Tapez pour chercher (Nom, GSM, CIN...)"
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              className="h-10 text-sm"
                              onKeyDown={(e) => e.stopPropagation()} // Prevent select from closing
                            />
                          </div>
                          {customers
                            .filter(c => {
                              if (c.type !== clientType) return false;
                              if (!customerSearch) return true;
                              const s = customerSearch.toLowerCase();
                              return (
                                c.name.toLowerCase().includes(s) ||
                                (c.first_name || "").toLowerCase().includes(s) ||
                                (c.id_number || "").toLowerCase().includes(s) ||
                                c.phone.includes(customerSearch)
                              );
                            })
                            .map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.type === 'company' ? `[ENTREPRISE] ${c.name}` : `${c.name} ${c.first_name}`} - {c.id_number || 'N/A'} ({c.phone})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  <div className="flex items-end md:col-span-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-11 rounded-xl border-dashed border-2 hover:bg-blue-50 hover:border-blue-300 transition-all w-full md:w-auto px-6 text-blue-600 font-bold"
                      onClick={() => navigate("/customers")}
                    >
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Gérer/Ajouter les Clients
                    </Button>
                  </div>
                </div>

                {clientType === 'company' && newRental.customer_id && (
                  <div className="mt-6 border-t border-slate-200 pt-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                       <Receipt className="w-5 h-5 text-indigo-600" /> Options de Regroupement par Facture Partagée
                    </h4>
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox"
                          id="group_lease_toggle"
                          checked={newRental.create_lease_group || !!newRental.lease_group_number}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (!checked) {
                              setNewRental(prev => ({
                                ...prev,
                                create_lease_group: false,
                                lease_group_number: "",
                                lease_suffix: ""
                              }));
                            } else {
                              setNewRental(prev => ({
                                ...prev,
                                create_lease_group: true,
                                lease_group_number: "",
                                lease_suffix: ""
                              }));
                            }
                          }}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <Label htmlFor="group_lease_toggle" className="font-bold text-slate-700 cursor-pointer text-sm">
                         inclure cette location dans une facture partagée
                        </Label>
                      </div>
                    </div>

                    {(newRental.create_lease_group || !!newRental.lease_group_number) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Type de regroupement</Label>
                          <Tabs 
                            value={newRental.create_lease_group ? "create" : "existing"} 
                            onValueChange={(val) => {
                              if (val === "create") {
                                setNewRental(prev => ({
                                  ...prev,
                                  create_lease_group: true,
                                  lease_group_number: ""
                                }));
                              } else {
                                const customerRentals = rentals.filter(r => r.customer_id && r.customer_id.toString() === newRental.customer_id?.toString());
                                const groups = Array.from(new Set(customerRentals.map(r => r.lease_group_number).filter(Boolean)));
                                setNewRental(prev => ({
                                  ...prev,
                                  create_lease_group: false,
                                  lease_group_number: groups.length > 0 ? String(groups[0]) : ""
                                }));
                              }
                            }}
                            className="w-full"
                          >
                            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                              <TabsTrigger value="create" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Créer une nouvelle facture</TabsTrigger>
                              <TabsTrigger value="existing" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm" disabled={Array.from(new Set(rentals.filter(r => r.customer_id && r.customer_id.toString() === newRental?.customer_id?.toString()).map(r => r.lease_group_number).filter(Boolean))).length === 0}>Associer à une facture existante</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>

                        {!newRental.create_lease_group && (
                          <div className="space-y-2 animate-in fade-in duration-300">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Sélectionner la facture de destination</Label>
                            <Select
                              value={newRental.lease_group_number || ""}
                              onValueChange={(val) => setNewRental(prev => ({ ...prev, lease_group_number: val, create_lease_group: false }))}
                            >
                              <SelectTrigger 
                                className="h-11 rounded-lg bg-white border-slate-200"
                                showClear={!!newRental.lease_group_number}
                                onClear={() => setNewRental(prev => ({ ...prev, lease_group_number: "" }))}
                              >
                                <SelectValue placeholder="Choisir une facture partagée..." />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from(new Set(rentals.filter(r => r.customer_id && r.customer_id.toString() === newRental?.customer_id?.toString()).map(r => r.lease_group_number).filter(Boolean))).map((grp) => (
                                  <SelectItem key={String(grp)} value={String(grp)}>
                                    Facture Partagée N° {String(grp)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {newRental.create_lease_group && (
                          <div className="p-4 bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs flex items-center justify-center">
                            Nouvelle facture partagée: la location obtiendra le suffixe "A" d'un nouveau numéro incrémentiel global.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                  <ShieldCheck className="w-6 h-6 text-blue-600" /> Informations Conducteur Principal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                  {clientType === 'individual' && (
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="is_client_first_driver"
                        checked={newRental.is_client_first_driver}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setNewRental(prev => ({
                            ...prev, 
                            is_client_first_driver: checked,
                          }));
                          if (checked && newRental.customer_id) {
                            handleCustomerSelect(newRental.customer_id);
                          }
                        }}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="is_client_first_driver" className="text-base font-bold text-blue-900 cursor-pointer">
                        Le client est le premier conducteur
                      </Label>
                    </div>
                  )}
                  
                  {!newRental.is_client_first_driver && (
                    <div className="space-y-2 col-span-1 md:col-span-1 border-l-4 border-blue-500 pl-4">
                      <Label className="text-sm font-bold text-slate-600">Choisir le conducteur principal (Individuel) <span className="text-red-500">*</span></Label>
                      <Select 
                        value={newRental.driver_id || ""}
                        onValueChange={handlePrimaryDriverSelect}
                      >
                        <SelectTrigger 
                          className="h-11 rounded-lg bg-white border-slate-200"
                          showClear={!!newRental.driver_id}
                          onClear={() => {
                            setNewRental({
                              ...newRental,
                              driver_id: "",
                              customer_name: "",
                              customer_phone: "",
                              customer_id_number: "",
                              customer_id_issued_date: "",
                              customer_id_issued_at: "",
                              customer_birth_date: "",
                              customer_birth_place: "",
                              customer_address: "",
                              customer_profession: "",
                              customer_license_number: "",
                              customer_license_issued_date: "",
                              customer_license_issued_at: "",
                            });
                          }}
                        >
                          <SelectValue placeholder="Sélectionner un conducteur...">
                            {newRental.driver_id && customers.find(c => c.id.toString() === newRental.driver_id) ? (
                              (() => {
                                const c = customers.find(c => c.id.toString() === newRental.driver_id);
                                return `${c.name} ${c.first_name}`;
                              })()
                            ) : null}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[350px]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input 
                              placeholder="Chercher conducteur..."
                              value={primaryDriverSearch}
                              onChange={(e) => setPrimaryDriverSearch(e.target.value)}
                              className="h-9 text-sm"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {customers
                            .filter(c => {
                               const isIndiv = c.type === 'individual';
                               const isNotSecond = c.id.toString() !== newRental.second_driver_id;
                               if (!isIndiv || !isNotSecond) return false;
                               if (!primaryDriverSearch) return true;
                               const s = primaryDriverSearch.toLowerCase();
                               return (
                                 c.name.toLowerCase().includes(s) ||
                                 (c.first_name || "").toLowerCase().includes(s) ||
                                 (c.id_number || "").toLowerCase().includes(s) ||
                                 c.phone.includes(primaryDriverSearch)
                               );
                            })
                            .map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} {c.first_name} - {c.id_number || 'N/A'} ({c.phone})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-blue-500 font-medium italic">Seuls les clients particuliers peuvent être conducteurs.</p>
                      
                      {/* En entreprise : coordonnées du conducteur choisi */}
                      {clientType === 'company' && newRental.driver_id && (
                        (() => {
                          const selectedDriverCust = customers.find(c => c.id.toString() === newRental.driver_id);
                          if (!selectedDriverCust) return null;
                          return (
                            <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-200/60 space-y-3">
                              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-200/50 pb-1 flex items-center gap-2">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                Coordonnées du Conducteur Sélectionné
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-slate-500 block">Nom complet</span>
                                  <span className="font-bold text-slate-800">{selectedDriverCust.name} {selectedDriverCust.first_name}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-slate-500 block">N° CIN / Passeport</span>
                                  <span className="font-bold text-slate-800">{selectedDriverCust.id_number || "—"}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-slate-500 block">Téléphone / N° Permis</span>
                                  <span className="font-bold text-slate-800">
                                    {selectedDriverCust.phone || "—"} {selectedDriverCust.license_number ? `(Permis: ${selectedDriverCust.license_number})` : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-8 pt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="age_check" checked={newRental.min_age_confirmed} onChange={e => setNewRental({...newRental, min_age_confirmed: e.target.checked})} className="w-6 h-6 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500" />
                    <Label htmlFor="age_check" className="text-base font-bold cursor-pointer text-slate-700">Age minimum exigé 25 ans</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="license_check" checked={newRental.license_duration_confirmed} onChange={e => setNewRental({...newRental, license_duration_confirmed: e.target.checked})} className="w-6 h-6 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500" />
                    <Label htmlFor="license_check" className="text-base font-bold cursor-pointer text-slate-700">Permis délivré depuis au moins 2 ans</Label>
                  </div>
                </div>
              </div>

              {/* Section: Second Conducteur - Mandatory as requested */}
              <div className="space-y-6 p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-200 pb-3">
                  <h3 className="text-xl font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-3">
                    <Users className="w-6 h-6 text-indigo-600" /> Informations Second Conducteur
                  </h3>
                  <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center">
                    <div className="flex-1">
                      <Label className="text-xs font-bold text-indigo-700 mb-1 block">Choisir le second conducteur (Optionnel)</Label>
                      <Select 
                        value={newRental.second_driver_id || ""}
                        onValueChange={handleSecondDriverSelect}
                      >
                        <SelectTrigger 
                          className="h-10 rounded-xl bg-white border-indigo-200"
                          showClear={!!newRental.second_driver_id}
                          onClear={() => {
                            setNewRental({
                              ...newRental,
                              second_driver_id: "",
                              second_driver_name: "",
                              second_driver_phone: "",
                              second_driver_id_number: "",
                              second_driver_id_issued_date: "",
                              second_driver_id_issued_at: "",
                              second_driver_birth_date: "",
                              second_driver_birth_place: "",
                              second_driver_address: "",
                              second_driver_profession: "",
                              second_driver_license_number: "",
                              second_driver_license_issued_date: "",
                              second_driver_license_issued_at: "",
                            });
                          }}
                        >
                          <SelectValue placeholder="Choisir depuis la liste...">
                            {newRental.second_driver_id && customers.find(c => c.id.toString() === newRental.second_driver_id.toString()) ? (
                              (() => {
                                const c = customers.find(c => c.id.toString() === newRental.second_driver_id.toString());
                                return c ? `${c.name} ${c.first_name}` : "";
                              })()
                            ) : null}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[350px]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input 
                              placeholder="Chercher..."
                              value={secondDriverSearch}
                              onChange={(e) => setSecondDriverSearch(e.target.value)}
                              className="h-9 text-sm"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {customers
                            .filter(c => {
                               const isInvidiual = c.type === 'individual';
                               const primaryDriverId = newRental.is_client_first_driver ? newRental.customer_id : newRental.driver_id;
                               const isNotPrimary = c.id.toString() !== primaryDriverId;
                               if (!isInvidiual || !isNotPrimary) return false;
                               if (!secondDriverSearch) return true;
                               const s = secondDriverSearch.toLowerCase();
                               return (
                                 c.name.toLowerCase().includes(s) ||
                                 (c.first_name || "").toLowerCase().includes(s) ||
                                 (c.id_number || "").toLowerCase().includes(s) ||
                                 c.phone.includes(secondDriverSearch)
                               );
                            })
                            .map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} {c.first_name} - {c.id_number || 'N/A'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-indigo-500 font-medium italic mt-1">Seuls les clients particuliers peuvent être conducteurs.</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-xs h-8 text-indigo-600 hover:text-indigo-800"
                      onClick={() => navigate("/customers")}
                    >
                      <PlusCircle className="w-3 h-3 mr-1" />
                      Nouveau Client?
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section: Véhicule */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                  <CarIcon className="w-6 h-6 text-blue-600" /> Véhicule & Période
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Merged Local de départ */}
                    <div className="space-y-2 relative" id="add-departure-place-container">
                      <Label className="text-sm font-bold text-slate-600">Local de départ <span className="text-red-500">*</span></Label>
                      <Input 
                        type="text" 
                        value={newRental.departure_place || ""} 
                        onChange={e => {
                          const val = e.target.value;
                          const matchedBranch = branches.find(b => b.name.toLowerCase() === val.trim().toLowerCase());
                          setNewRental({
                            ...newRental, 
                            departure_place: val,
                            branch_id: matchedBranch ? matchedBranch.id.toString() : "",
                            return_place: val
                          });
                        }} 
                        onFocus={() => setShowAddDepartureDropdown(true)}
                        onBlur={() => setTimeout(() => setShowAddDepartureDropdown(false), 200)}
                        required 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200 text-slate-600 placeholder-slate-400" 
                        placeholder="Choisir le local de départ" 
                      />
                      {showAddDepartureDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[250px] overflow-y-auto">
                          {branches
                            .filter(b => b.name.toLowerCase().includes((newRental.departure_place || "").toLowerCase()))
                            .map(b => (
                              <div
                                key={b.id}
                                className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-slate-700 font-semibold border-b border-slate-100 last:border-none text-sm"
                                onMouseDown={() => {
                                  setNewRental({
                                    ...newRental,
                                    branch_id: b.id.toString(),
                                    departure_place: b.name,
                                    return_place: b.name
                                  });
                                  setShowAddDepartureDropdown(false);
                                }}
                              >
                                {b.name}
                              </div>
                            ))}
                          {branches.filter(b => b.name.toLowerCase().includes((newRental.departure_place || "").toLowerCase())).length === 0 && (
                            <div className="px-4 py-2 text-xs text-slate-400 italic">
                              Saisir en tant que lieu personnalisé
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Date de départ <span className="text-red-500">*</span></Label>
                      <Input type="date" value={newRental.start_date || ""} onChange={e => setNewRental({...newRental, start_date: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <TimeStepSelect 
                      label="Heure de départ" 
                      value={newRental.departure_time || "08:00"} 
                      onChange={v => setNewRental({...newRental, departure_time: v})} 
                      required
                    />
                    <div className="space-y-2 relative" id="add-return-place-container">
                      <Label className="text-sm font-bold text-slate-600">Lieu de retour <span className="text-red-500">*</span></Label>
                      <Input 
                        type="text" 
                        value={newRental.return_place || ""} 
                        onChange={e => {
                          const val = e.target.value;
                          setNewRental({
                            ...newRental, 
                            return_place: val
                          });
                        }} 
                        onFocus={() => setShowAddReturnDropdown(true)}
                        onBlur={() => setTimeout(() => setShowAddReturnDropdown(false), 200)}
                        required 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200 text-slate-600 placeholder-slate-400" 
                        placeholder="Choisir le lieu de retour" 
                      />
                      {showAddReturnDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[250px] overflow-y-auto">
                          {branches
                            .filter(b => b.name.toLowerCase().includes((newRental.return_place || "").toLowerCase()))
                            .map(b => (
                              <div
                                key={b.id}
                                className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-slate-700 font-semibold border-b border-slate-100 last:border-none text-sm"
                                onMouseDown={() => {
                                  setNewRental({
                                    ...newRental,
                                    return_place: b.name
                                  });
                                  setShowAddReturnDropdown(false);
                                }}
                              >
                                {b.name}
                              </div>
                            ))}
                          {branches.filter(b => b.name.toLowerCase().includes((newRental.return_place || "").toLowerCase())).length === 0 && (
                            <div className="px-4 py-2 text-xs text-slate-400 italic">
                              Saisir en tant que lieu personnalisé
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Date de retour prévue <span className="text-red-500">*</span></Label>
                      <Input type="date" value={newRental.end_date || ""} min={newRental.start_date} onChange={e => setNewRental({...newRental, end_date: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <TimeStepSelect 
                      label="Heure de retour" 
                      value={newRental.return_time || "08:00"} 
                      onChange={v => setNewRental({...newRental, return_time: v})} 
                      required
                    />

                    {/* Nombre de jours */}
                    <div className="space-y-2 lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-slate-600">Nombre de jours <span className="text-red-500">*</span></Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="force_days_checkbox"
                            checked={newRental.is_rental_days_overridden || false}
                            onChange={e => {
                              const checked = e.target.checked;
                              const autoVal = getAutoRentalDays(newRental).toString();
                              setNewRental({
                                ...newRental,
                                is_rental_days_overridden: checked,
                                rental_days: checked ? autoVal : ""
                              });
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <Label htmlFor="force_days_checkbox" className="text-xs font-semibold cursor-pointer text-slate-500">Forcer</Label>
                        </div>
                      </div>
                      <Input
                        type="number"
                        value={newRental.is_rental_days_overridden ? (newRental.rental_days || "") : getAutoRentalDays(newRental)}
                        disabled={!newRental.is_rental_days_overridden}
                        onChange={e => setNewRental({...newRental, rental_days: e.target.value})}
                        required
                        min={1}
                        className="h-12 rounded-xl text-lg bg-white border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 font-bold"
                      />
                    </div>
                  <div className="lg:col-span-2 space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Voiture <span className="text-red-500">*</span></Label>
                    <Select 
                      value={newRental.car_id || ""} 
                      onValueChange={v => {
                        const car = cars.find(c => c.id.toString() === v);
                        setNewRental({
                          ...newRental, 
                          car_id: v,
                          daily_price: car ? car.daily_price?.toString() || "" : newRental.daily_price,
                          km_depart: car ? car.mileage?.toString() || "" : newRental.km_depart,
                          fuel_total_bars: car ? car.fuel_total_bars?.toString() || "8" : "8",
                          fuel_depart_bars: ""
                        });
                      }}
                      disabled={!newRental.start_date || !newRental.end_date}
                    >
                      <SelectTrigger 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200"
                        showClear={!!newRental.car_id}
                        onClear={() => setNewRental({
                          ...newRental,
                          car_id: "",
                          daily_price: "",
                          km_depart: "",
                          fuel_total_bars: "8",
                          fuel_depart_bars: ""
                        })}
                      >
                        <SelectValue placeholder={(!newRental.start_date || !newRental.end_date) ? "Choisir les dates d'abord" : "Sélectionner une voiture"}>
                          {newRental.car_id && cars.find(c => c.id.toString() === newRental.car_id) ? (
                            (() => {
                              const c = cars.find(c => c.id.toString() === newRental.car_id);
                              return `${c.brand} ${c.model}`;
                            })()
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl max-h-[350px]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input 
                              placeholder="Chercher par marque, modèle ou matricule..."
                              value={vehicleSearch}
                              onChange={(e) => setVehicleSearch(e.target.value)}
                              className="h-10 text-sm"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {availableCarsForNewRental
                            .filter(c => {
                              if (!vehicleSearch) return true;
                              const s = vehicleSearch.toLowerCase();
                              return (
                                c.brand.toLowerCase().includes(s) ||
                                c.model.toLowerCase().includes(s) ||
                                c.registration.toLowerCase().includes(s)
                              );
                            })
                            .map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                            <div className="flex flex-col text-left py-1">
                              <span className="font-bold">{c.registration} - {c.brand} {c.model}</span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin size={10} /> {c.branch_name || 'Inconnu'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">KM départ <span className="text-red-500">*</span></Label>
                    <Input type="number" value={newRental.km_depart || ""} onChange={e => setNewRental({...newRental, km_depart: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <FuelBarsSelector 
                      label="Niveau de carburant (Départ)"
                      total={parseInt(newRental.fuel_total_bars || "8")}
                      value={parseInt(newRental.fuel_depart_bars || "0")}
                      onChange={v => setNewRental({...newRental, fuel_depart_bars: v.toString()})}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Photos */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                  <Camera className="w-6 h-6 text-blue-600" /> Photos de l'état actuel (Départ)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {newRental.state_photos.map((photo, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 group shadow-sm">
                      <img src={photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => setNewRental(prev => ({ ...prev, state_photos: prev.state_photos.filter((_, idx) => idx !== i) }))}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                    <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                      <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-wider">Ajouter Photo</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Section: Facturation */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                  <CreditCard className="w-6 h-6 text-blue-600" /> Facturation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Prix par jour (DT)</Label>
                    <Input type="number" value={newRental.daily_price || ""} onChange={e => setNewRental({...newRental, daily_price: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Mode de paiement caution</Label>
                    <Select value={newRental.payment_mode || "Espèces"} onValueChange={v => setNewRental({...newRental, payment_mode: v})}>
                      <SelectTrigger 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200"
                        showClear={!!newRental.payment_mode}
                        onClear={() => setNewRental({...newRental, payment_mode: ""})}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Espèces">Espèces</SelectItem>
                        <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                        <SelectItem value="Chèque">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Montant Caution (DT)</Label>
                    <Input type="number" value={newRental.deposit_amount || ""} onChange={e => setNewRental({...newRental, deposit_amount: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-bold text-slate-600">Montant Payé (DT)</Label>
                      <Button 
                        type="button" 
                        variant="link" 
                        size="sm" 
                        onClick={() => {
                          const total = calculateTotalPrice();
                          setNewRental({...newRental, amount_paid: total, amount_remaining: "0.000"});
                        }}
                        className="text-xs font-black text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        ✓ Tout payer
                      </Button>
                    </div>
                    <Input 
                      type="number" 
                      value={newRental.amount_paid || ""} 
                      onChange={e => {
                        const paid = parseFloat(e.target.value || "0");
                        const total = parseFloat(calculateTotalPrice());
                        setNewRental({...newRental, amount_paid: e.target.value, amount_remaining: (total - paid).toFixed(3)});
                      }} 
                      className="h-12 rounded-xl text-lg bg-white border-slate-200" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Reste à payer (DT)</Label>
                    <Input type="number" value={newRental.amount_remaining || ""} disabled className="h-12 rounded-xl text-lg bg-slate-50 border-slate-200" />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 flex justify-between items-center text-white">
                <div>
                  <div className="text-blue-100 text-sm font-bold uppercase tracking-widest">Total Estimé</div>
                  <div className="text-sm text-blue-200">Incluant taxes et frais</div>
                </div>
                <div className="text-4xl font-black">{calculateTotalPrice()} DT</div>
              </div>

              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 py-3.5 px-5 rounded-2xl shadow-sm">
                <input 
                  type="checkbox"
                  id="generate_contract_chk"
                  checked={shouldGenerateContract}
                  onChange={(e) => setShouldGenerateContract(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <Label htmlFor="generate_contract_chk" className="font-bold text-slate-700 cursor-pointer text-sm">
                  Générer et télécharger le contrat de location automatiquement à la création
                </Label>
              </div>

              <div className="pt-8 border-t flex justify-between items-center sm:justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setNewRental({
                      ...initialRentalState,
                      km_allowance: settings?.km_allowance || 280,
                      excess_km_price: settings?.excess_km_price || 0.5
                    });
                    setShowChauffeurSelect(false);
                    setClientType('individual');
                  }} 
                  className="h-12 px-8 text-lg rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  Réinitialiser
                </Button>
                <div className="flex gap-4">
                  <Button type="button" variant="ghost" onClick={() => navigate("/rentals")} className="h-12 px-8 text-lg rounded-xl">Annuler</Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="h-12 px-12 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
                  >
                    {submitting ? "Création en cours..." : "Créer le Contrat"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <>
          <div className={(isEditOpen || isExtendOpen || isActivationOpen) ? "hidden" : "space-y-6"}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("rentals.title")}</h1>
              <p className="text-slate-500 mt-1">Gérez vos contrats de location active.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {lateRentals.length > 0 && (
                <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl border border-red-200 animate-pulse">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold">Attention: {lateRentals.length} véhicule(s) en retard de retour !</span>
                </div>
              )}

              <Button 
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl h-11 px-6 text-white"
                onClick={() => navigate("/rentals/new")}
              >
                <Plus className="w-5 h-5 mr-2" />
                {t("rentals.new")}
              </Button>
            </div>
          </div>

          <Card className="border border-slate-200/80 shadow-md rounded-2xl overflow-hidden bg-white mb-6">
            <CardContent className="p-6 space-y-4">
                {/* Search Bar Row with Reset button */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      placeholder="Saisie rapide (Contrat, Nom, Téléphone, Immatriculation, CIN...)" 
                      value={search || ""}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-12 h-11 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm shadow-sm w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <Button 
                      type="button" 
                      variant={showAdvancedFilters ? "default" : "outline"}
                      size="sm" 
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`h-11 px-4 font-bold rounded-xl text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center transition-all cursor-pointer ${
                        showAdvancedFilters 
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200" 
                          : "text-slate-600 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      {showAdvancedFilters ? "Masquer les filtres" : "Filtres avancés"}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={resetAllFilters}
                      className="h-11 px-4 text-slate-600 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50 font-bold rounded-xl text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Réinitialiser tout
                    </Button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-slate-100 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* SECTION 1: STATUT & PERIODE */}
                          <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b">
                              <Calendar className="w-4 h-4 text-indigo-500" /> 1. Statut & Période
                            </h4>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-600">Statut du contrat</Label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                  <SelectTrigger 
                                    className="h-11 rounded-xl bg-white border-slate-200 text-sm"
                                    showClear={filterStatus !== "all"}
                                    onClear={() => setFilterStatus("all")}
                                  >
                                    <SelectValue placeholder="Tous les statuts" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-lg">
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="active">En cours</SelectItem>
                                    <SelectItem value="scheduled">Programmé</SelectItem>
                                    <SelectItem value="completed">Clôturé</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-600">Date début</Label>
                                  <Input 
                                    type="date" 
                                    value={filterStartDate} 
                                    onChange={e => setFilterStartDate(e.target.value)} 
                                    className="h-11 text-sm rounded-xl bg-white border-slate-200 px-3" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-600">Date fin</Label>
                                  <Input 
                                    type="date" 
                                    value={filterEndDate} 
                                    onChange={e => setFilterEndDate(e.target.value)} 
                                    className="h-11 text-sm rounded-xl bg-white border-slate-200 px-3" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 2: INFORMATION CLIENT */}
                          <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b">
                              <User className="w-4 h-4 text-emerald-500" /> 2. Informations Client
                            </h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-600">Nom / Prénom</Label>
                                  <Input 
                                    placeholder="Saisir nom..." 
                                    value={realFilterClientName} 
                                    onChange={e => setRealFilterClientName(e.target.value)} 
                                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-600">Numéro de téléphone</Label>
                                  <Input 
                                    placeholder="Saisir numéro..." 
                                    value={filterClientPhone} 
                                    onChange={e => setFilterClientPhone(e.target.value)} 
                                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-600">Type de client</Label>
                                  <Select value={filterClientType} onValueChange={(val) => {
                                    setFilterClientType(val);
                                    setFilterSelectedClientId("all");
                                    setCustomerFilterSearch("");
                                  }}>
                                    <SelectTrigger 
                                      className="h-11 rounded-xl bg-white border-slate-200 text-xs"
                                      showClear={filterClientType !== "all"}
                                      onClear={() => {
                                        setFilterClientType("all");
                                        setFilterSelectedClientId("all");
                                        setCustomerFilterSearch("");
                                      }}
                                    >
                                      <SelectValue placeholder="Choisir le type..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                      <SelectItem value="all">Choisir le type...</SelectItem>
                                      <SelectItem value="individual">👤 Particulier</SelectItem>
                                      <SelectItem value="company">🏢 Entreprise</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-600">Client spécifique</Label>
                                  <Select 
                                    value={filterSelectedClientId} 
                                    onValueChange={setFilterSelectedClientId}
                                    disabled={filterClientType === "all"}
                                  >
                                    <SelectTrigger 
                                      className="h-11 rounded-xl bg-white border-slate-200 text-xs disabled:bg-slate-100 disabled:opacity-50"
                                      showClear={filterSelectedClientId !== "all"}
                                      onClear={() => setFilterSelectedClientId("all")}
                                    >
                                      <SelectValue placeholder={filterClientType === "all" ? "Choisir type d'abord" : "Sélectionner..."} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[260px] rounded-lg">
                                      <div className="p-2 border-b border-slate-100" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                        <Input 
                                          placeholder="Filtrer par nom ou prénom..."
                                          value={customerFilterSearch}
                                          onChange={(e) => setCustomerFilterSearch(e.target.value)}
                                          className="h-8 text-xs bg-slate-50 border-slate-200 focus:ring-1 focus:ring-blue-500"
                                        />
                                      </div>
                                      <SelectItem value="all">Tous les clients</SelectItem>
                                      {filteredCustomersForDropdown.length === 0 ? (
                                        <div className="p-3 text-xs text-center text-slate-400 font-medium">Aucun client trouvé</div>
                                      ) : (
                                        filteredCustomersForDropdown.map(c => (
                                          <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.type === 'company' ? `🏢 ${c.name}` : `👤 ${c.name || ""} ${c.first_name || ""}`}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 3: VEHICULE */}
                          <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b">
                              <CarIcon className="w-4 h-4 text-blue-500" /> 3. Véhicule
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Marque */}
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-600">Marque</Label>
                                <Select value={filterCarBrand} onValueChange={setFilterCarBrand}>
                                  <SelectTrigger 
                                    className="h-11 rounded-xl bg-white border-slate-200 text-xs"
                                    showClear={filterCarBrand !== "all"}
                                    onClear={() => setFilterCarBrand("all")}
                                  >
                                    <SelectValue placeholder="Toutes" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[280px] rounded-lg">
                                    <div className="p-2 border-b border-slate-100" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                      <Input 
                                        placeholder="Rechercher marque..."
                                        value={vehicleBrandSearch}
                                        onChange={(e) => setVehicleBrandSearch(e.target.value)}
                                        className="h-8 text-xs bg-slate-50 border-slate-200"
                                      />
                                    </div>
                                    <SelectItem value="all">Toutes les marques</SelectItem>
                                    {filteredBrandsForDropdown.length === 0 ? (
                                      <div className="p-3 text-xs text-center text-slate-400 font-medium">Aucune marque</div>
                                    ) : (
                                      filteredBrandsForDropdown.map(brand => (
                                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Modèle */}
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-600">Modèle</Label>
                                <Select value={filterCarModel} onValueChange={setFilterCarModel}>
                                  <SelectTrigger 
                                    className="h-11 rounded-xl bg-white border-slate-200 text-xs"
                                    showClear={filterCarModel !== "all"}
                                    onClear={() => setFilterCarModel("all")}
                                  >
                                    <SelectValue placeholder="Tous" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[280px] rounded-lg">
                                    <div className="p-2 border-b border-slate-100" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                      <Input 
                                        placeholder="Rechercher modèle..."
                                        value={vehicleModelSearch}
                                        onChange={(e) => setVehicleModelSearch(e.target.value)}
                                        className="h-8 text-xs bg-slate-50 border-slate-200"
                                      />
                                    </div>
                                    <SelectItem value="all">Tous les modèles</SelectItem>
                                    {filteredModelsForDropdown.length === 0 ? (
                                      <div className="p-3 text-xs text-center text-slate-400 font-medium">Aucun modèle</div>
                                    ) : (
                                      filteredModelsForDropdown.map(model => (
                                        <SelectItem key={model} value={model}>{model}</SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Immatriculation */}
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-600">Immatriculation</Label>
                                <Select value={filterCarReg} onValueChange={setFilterCarReg}>
                                  <SelectTrigger 
                                    className="h-11 rounded-xl bg-white border-slate-200 text-xs"
                                    showClear={filterCarReg !== "all"}
                                    onClear={() => setFilterCarReg("all")}
                                  >
                                    <SelectValue placeholder="Toutes" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[280px] rounded-lg">
                                    <div className="p-2 border-b border-slate-100" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                      <Input 
                                        placeholder="Rechercher immat..."
                                        value={vehicleRegSearch}
                                        onChange={(e) => setVehicleRegSearch(e.target.value)}
                                        className="h-8 text-xs bg-slate-50 border-slate-200"
                                      />
                                    </div>
                                    <SelectItem value="all">Toutes les immatriculations</SelectItem>
                                    {filteredRegsForDropdown.length === 0 ? (
                                      <div className="p-3 text-xs text-center text-slate-400 font-medium">Aucune immatriculation</div>
                                    ) : (
                                      filteredRegsForDropdown.map(reg => (
                                        <SelectItem key={reg} value={reg}>{reg}</SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 4: AGENCE & LOCALISATION */}
                          <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b">
                              <MapPin className="w-4 h-4 text-amber-500" /> 4. Agence & Localisation
                            </h4>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-600">Local Assigné (Agence)</Label>
                                <Select value={filterBranchId} onValueChange={setFilterBranchId}>
                                  <SelectTrigger 
                                    className="h-11 rounded-xl bg-white border-slate-200 text-sm"
                                    showClear={filterBranchId !== "all"}
                                    onClear={() => setFilterBranchId("all")}
                                  >
                                    <SelectValue placeholder="Tous les locaux" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-lg">
                                    <SelectItem value="all">Tous les locaux</SelectItem>
                                    {branches.map(b => (
                                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-600">Départ Agence</Label>
                                  <Select value={filterDeparturePlace || "all"} onValueChange={setFilterDeparturePlace}>
                                    <SelectTrigger 
                                      className="h-11 rounded-xl bg-white border-slate-200 text-xs"
                                      showClear={filterDeparturePlace !== "all"}
                                      onClear={() => setFilterDeparturePlace("all")}
                                    >
                                      <SelectValue placeholder="Tous" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[220px] rounded-lg">
                                      <SelectItem value="all">Tous les départs</SelectItem>
                                      {uniqueDeparturePlaces.map(place => (
                                        <SelectItem key={place} value={place}>{place}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-600">Retour Agence</Label>
                                  <Select value={filterReturnPlace || "all"} onValueChange={setFilterReturnPlace}>
                                    <SelectTrigger 
                                      className="h-11 rounded-xl bg-white border-slate-200 text-xs"
                                      showClear={filterReturnPlace !== "all"}
                                      onClear={() => setFilterReturnPlace("all")}
                                    >
                                      <SelectValue placeholder="Tous" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[220px] rounded-lg">
                                      <SelectItem value="all">Tous les retours</SelectItem>
                                      {uniqueReturnPlaces.map(place => (
                                        <SelectItem key={place} value={place}>{place}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions Row to reset or close the filter section */}
                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              resetAllFilters();
                              setShowAdvancedFilters(false);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-xl text-xs flex items-center gap-1.5 justify-center h-10 px-4 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Réinitialiser & Fermer
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvancedFilters(false)}
                            className="h-10 px-4 text-slate-700 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50 font-bold rounded-xl text-xs flex items-center gap-1.5 justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Fermer les filtres
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-md overflow-hidden rounded-2xl bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead 
                  className="font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("customer")}
                >
                  <div className="flex items-center gap-1 select-none">
                    <span>{t("rentals.customer")}</span>
                    <span className="flex flex-col opacity-70">
                      <ChevronUp className={cn("w-3 h-3 -mb-1", sortField === "customer" && sortDirection === "asc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                      <ChevronDown className={cn("w-3 h-3", sortField === "customer" && sortDirection === "desc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                    </span>
                  </div>
                </TableHead>

                <TableHead 
                  className="font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("car")}
                >
                  <div className="flex items-center gap-1 select-none">
                    <span>{t("nav.cars")}</span>
                    <span className="flex flex-col opacity-70">
                      <ChevronUp className={cn("w-3 h-3 -mb-1", sortField === "car" && sortDirection === "asc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                      <ChevronDown className={cn("w-3 h-3", sortField === "car" && sortDirection === "desc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                    </span>
                  </div>
                </TableHead>

                <TableHead 
                  className="font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("branch")}
                >
                  <div className="flex items-center gap-1 select-none">
                    <span>{t("nav.branches")}</span>
                    <span className="flex flex-col opacity-70">
                      <ChevronUp className={cn("w-3 h-3 -mb-1", sortField === "branch" && sortDirection === "asc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                      <ChevronDown className={cn("w-3 h-3", sortField === "branch" && sortDirection === "desc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                    </span>
                  </div>
                </TableHead>

                <TableHead 
                  className="font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("dates")}
                >
                  <div className="flex items-center gap-1 select-none">
                    <span>{t("rentals.startDate")} - {t("rentals.endDate")}</span>
                    <span className="flex flex-col opacity-70">
                      <ChevronUp className={cn("w-3 h-3 -mb-1", sortField === "dates" && sortDirection === "asc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                      <ChevronDown className={cn("w-3 h-3", sortField === "dates" && sortDirection === "desc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                    </span>
                  </div>
                </TableHead>

                <TableHead 
                  className="font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("duration")}
                >
                  <div className="flex items-center gap-1 select-none">
                    <span>Période</span>
                    <span className="flex flex-col opacity-70">
                      <ChevronUp className={cn("w-3 h-3 -mb-1", sortField === "duration" && sortDirection === "asc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                      <ChevronDown className={cn("w-3 h-3", sortField === "duration" && sortDirection === "desc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                    </span>
                  </div>
                </TableHead>

                <TableHead 
                  className="font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center gap-1 select-none">
                    <span>{t("rentals.totalPrice")}</span>
                    <span className="flex flex-col opacity-70">
                      <ChevronUp className={cn("w-3 h-3 -mb-1", sortField === "price" && sortDirection === "asc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                      <ChevronDown className={cn("w-3 h-3", sortField === "price" && sortDirection === "desc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                    </span>
                  </div>
                </TableHead>

                <TableHead 
                  className="font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("paid")}
                >
                  <div className="flex items-center gap-1 select-none font-mono">
                    <span>Payé / Reste</span>
                    <span className="flex flex-col opacity-70">
                      <ChevronUp className={cn("w-3 h-3 -mb-1", sortField === "paid" && sortDirection === "asc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                      <ChevronDown className={cn("w-3 h-3", sortField === "paid" && sortDirection === "desc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                    </span>
                  </div>
                </TableHead>

                <TableHead 
                  className="font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1 select-none">
                    <span>Statut</span>
                    <span className="flex flex-col opacity-70">
                      <ChevronUp className={cn("w-3 h-3 -mb-1", sortField === "status" && sortDirection === "asc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                      <ChevronDown className={cn("w-3 h-3", sortField === "status" && sortDirection === "desc" ? "text-indigo-600 scale-110 font-bold" : "text-slate-300")} />
                    </span>
                  </div>
                </TableHead>

                <TableHead className="text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="h-48 text-center"><Clock className="w-8 h-8 animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
              ) : paginatedRentals.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-48 text-center text-slate-500">Aucune location trouvée.</TableCell></TableRow>
              ) : paginatedRentals.map((rental) => {
                const returnDateTime = new Date(`${rental.end_date}T${rental.return_time || "23:59"}`);
                const isLate = rental.status === 'active' && returnDateTime < new Date();
                const isScheduled = rental.status === 'scheduled';
                return (
                  <TableRow 
                    key={rental.id} 
                    className={cn(
                      "transition-colors border-slate-50",
                      isLate ? "bg-red-50 hover:bg-red-100 border-red-100" : 
                      isScheduled ? "bg-blue-50/30 hover:bg-blue-50 border-blue-50" :
                      "hover:bg-slate-50/50"
                    )}
                  >
                    <TableCell>
                      <div className="font-bold text-slate-900">{rental.customer_name}</div>
                      <div className="text-xs text-slate-500">{rental.customer_phone}</div>
                      {rental.customer_type === "company" && rental.driver_name && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          Conducteur: <span className="font-semibold text-slate-700">{rental.driver_name}</span>
                        </div>
                      )}
                      {rental.contract_number && (
                        <div className="text-[10.5px] font-bold text-indigo-600 mt-1 bg-indigo-50/60 inline-block px-1.5 py-0.5 rounded-md">Contrat: {rental.contract_number}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900">{rental.brand} {rental.model}</div>
                      <div className="text-xs text-slate-500 font-mono">{rental.registration}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        {rental.branch_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn("text-xs font-medium", isLate ? "text-red-700 font-bold" : "text-slate-700")}>
                        {format(new Date(rental.start_date), 'dd MMM yyyy')}
                        <ChevronRight className="w-3 h-3 inline mx-1 text-slate-300" />
                        {format(new Date(rental.end_date), 'dd MMM yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-slate-700">
                        {rental.rental_days ? rental.rental_days : getAutoRentalDays(rental)} j
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-blue-600">{rental.total_price} DT</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-green-600 font-bold text-sm">{rental.amount_paid || 0} DT</span>
                        <span className="text-red-500 text-[10px] font-medium leading-none">Reste: {((rental.total_price || 0) - (rental.amount_paid || 0)).toFixed(3)} DT</span>
                      </div>
                    </TableCell>
                    <TableCell>
                    {isLate ? (
                        <Badge className="bg-red-600 text-white border-none shadow-sm px-3 py-1 rounded-full animate-pulse font-black text-[10px]">
                          RETARD DE RETOUR
                        </Badge>
                      ) : (
                        <Badge className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          rental.status === 'active' ? "bg-green-100 text-green-700" : 
                          rental.status === 'scheduled' ? "bg-blue-100 text-blue-700" :
                          rental.status === 'completed' ? "bg-slate-100 text-slate-700" : "bg-red-100 text-red-700"
                        )}>
                          {rental.status === 'active' ? "En cours" : 
                           rental.status === 'scheduled' ? "Programmé" : 
                           rental.status === 'completed' ? "Clôturé" : "Annulé"}
                        </Badge>
                      )}
                    </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* 1. Quick View Details */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setSelectedRental(rental);
                          setIsDetailsOpen(true);
                        }}
                        className="h-9 w-9 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                        title="Fiche Détails"
                      >
                        <Eye className="w-[18px] h-[18px]" />
                      </Button>

                      {/* 2. Standardized Lifecycle Action Container (Prevents horizontal layout shifts) */}
                      <div className="w-28 flex justify-center">
                        {rental.status === 'scheduled' ? (
                          <Button 
                            onClick={() => triggerActivation(rental)}
                            className="w-full h-9 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Activer
                          </Button>
                        ) : rental.status === 'active' ? (
                          <Button 
                            onClick={() => {
                              setSelectedRental(rental);
                              setReturningRental({
                                ...returningRental,
                                return_date: format(new Date(), 'yyyy-MM-dd'),
                                return_mileage: rental.current_mileage,
                                fuel_return_bars: rental.fuel_depart_bars?.toString() || "8",
                                return_photos: [],
                                is_damaged: false,
                                damage_deduction: "0"
                              });
                              setConfirmReturnPayment(false);
                              setIsReturnOpen(true);
                            }}
                            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider"
                          >
                            <RotateCcw className="w-3.5 h-3.5 animate-pulse" />
                            Retour
                          </Button>
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 select-none tracking-wider bg-slate-50 py-1.5 px-4 rounded-xl border border-slate-150">
                            PRÊT
                          </span>
                        )}
                      </div>

                      {/* 3. Consolidated Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }), 
                          "h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all"
                        )}>
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border border-slate-100 shadow-2xl bg-white/95 backdrop-blur-md">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase px-3 py-1.5 tracking-wider">Édition & Durée</DropdownMenuLabel>
                            
                            {isAdmin && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  const isOverridden = rental.is_rental_days_overridden !== undefined ? rental.is_rental_days_overridden : false;
                                  const rDays = rental.rental_days !== undefined ? rental.rental_days : "";
                                  setEditingRental({ 
                                    ...initialRentalState, 
                                    ...rental,
                                    is_rental_days_overridden: isOverridden,
                                    rental_days: rDays
                                  });
                                  setIsEditOpen(true);
                                }} 
                                className="rounded-xl flex items-center gap-3 p-2.5 cursor-pointer group focus:bg-blue-50 focus:text-blue-700 transition-all"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-focus:bg-white transition-all shadow-sm">
                                  <Edit2 className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs text-slate-800 group-focus:text-blue-900">Modifier la location</span>
                                  <span className="text-[9px] text-slate-400 group-focus:text-blue-600">Info conducteur, tarifs...</span>
                                </div>
                              </DropdownMenuItem>
                            )}

                            {rental.status === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => handleExtendRental(rental)} 
                                className="rounded-xl flex items-center gap-3 p-2.5 cursor-pointer group focus:bg-amber-50 focus:text-amber-700 transition-all"
                              >
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-focus:bg-white transition-all shadow-sm">
                                  <PlusCircle className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs text-slate-800 group-focus:text-amber-900">Prolonger la durée</span>
                                  <span className="text-[9px] text-slate-400 group-focus:text-amber-600">Ajouter des jours</span>
                                </div>
                              </DropdownMenuItem>
                            )}

                            {(rental.status === 'active' || rental.status === 'scheduled') && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedRental(rental);
                                  setSwappingData({
                                    new_car_id: "",
                                    old_car_return_mileage: rental.current_mileage?.toString() || "",
                                    old_car_return_fuel: rental.fuel_depart_bars || 0,
                                    new_car_start_mileage: "",
                                    new_car_start_fuel: 0,
                                    swap_date: format(new Date(), "yyyy-MM-dd"),
                                    swap_reason: "",
                                    daily_price: rental.daily_price?.toString() || "0",
                                    new_payment: "0",
                                    new_payment_mode: "Espèces"
                                  });
                                  setSwapBranchFilter("all");
                                  setIsSwapOpen(true);
                                }} 
                                className="rounded-xl flex items-center gap-3 p-2.5 cursor-pointer group focus:bg-indigo-50 focus:text-indigo-700 transition-all"
                              >
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-focus:bg-white transition-all shadow-sm">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs text-slate-800 group-focus:text-indigo-900">Changer de véhicule</span>
                                  <span className="text-[9px] text-slate-400 group-focus:text-indigo-600">Remplacement (Swap)</span>
                                </div>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                          
                          <DropdownMenuSeparator className="my-1.5 bg-slate-150" />

                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase px-3 py-1.5 tracking-wider">Facturation & PDF</DropdownMenuLabel>

                            <DropdownMenuItem 
                              onClick={() => handleGenerateInvoiceSingle(rental)} 
                              className="rounded-xl flex items-center gap-3 p-2.5 cursor-pointer group focus:bg-emerald-50 focus:text-emerald-700 transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-focus:bg-white transition-all shadow-sm">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-slate-800 group-focus:text-emerald-900">Générer la Facture</span>
                                <span className="text-[9px] text-slate-400 group-focus:text-emerald-600">Calcul transparent</span>
                              </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => generateContractPDF(getRentalWithDriverDetails(rental), settings)} 
                              className="rounded-xl flex items-center gap-3 p-2.5 cursor-pointer group focus:bg-slate-100 focus:text-slate-800 transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-focus:bg-white transition-all shadow-sm">
                                <Download className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-slate-800 group-focus:text-slate-900">Contrat officiel PDF</span>
                                <span className="text-[9px] text-slate-400 group-focus:text-slate-600">Télécharger & Imprimer</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          
                          <DropdownMenuSeparator className="my-1.5 bg-slate-150" />
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[9px] font-black text-rose-450 uppercase px-3 py-1.5 tracking-wider font-semibold">Opérations Critiques</DropdownMenuLabel>
                            
                            {rental.status !== 'cancelled' && rental.status !== 'completed' && (
                              <DropdownMenuItem 
                                onClick={() => { setSelectedRental(rental); setIsCancelOpen(true); }} 
                                className="rounded-xl flex items-center gap-3 p-2.5 cursor-pointer group focus:bg-rose-50 focus:text-rose-700 transition-all"
                              >
                                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-focus:bg-white transition-all shadow-sm">
                                  <X className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs text-rose-700 group-focus:text-rose-800">Annuler la location</span>
                                  <span className="text-[9px] text-rose-400 group-focus:text-rose-600">Rembourse le véhicule</span>
                                </div>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem 
                              onClick={() => { setSelectedRental(rental); setIsDeleteOpen(true); }} 
                              className="rounded-xl flex items-center gap-3 p-2.5 cursor-pointer group focus:bg-red-50 focus:text-red-700 transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-650 flex items-center justify-center group-focus:bg-white transition-all shadow-sm">
                                <Trash2 className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-red-700 group-focus:text-red-800">Supprimer définitivement</span>
                                <span className="text-[9px] text-red-400 group-focus:text-red-600">Efface de toute la base</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ); })}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredRentals.length / itemsPerPage)}
          itemsPerPage={itemsPerPage}
          totalItems={filteredRentals.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
            </Card>
        </div>
        </>
      )}

      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onConfirm={handleCancelRental}
        title="Annuler la location"
        description={`Êtes-vous sûr de vouloir annuler la location de ${selectedRental?.customer_name} ? Cette action est irréversible.`}
        confirmText="Annuler"
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteRental}
        title="Supprimer la location"
        description={`Êtes-vous sûr de vouloir supprimer la location de ${selectedRental?.customer_name} ? Cette action est irréversible.`}
      />

      <Dialog open={isSwapOpen} onOpenChange={setIsSwapOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-none shadow-2xl bg-white">
          <DialogHeader className="p-8 border-b bg-amber-50">
            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-amber-900">
              <Zap className="w-8 h-8 text-amber-600" />
              Changement de véhicule
            </DialogTitle>
            <DialogDescriptionUI className="text-slate-600 font-medium">
              Transférer la location de {selectedRental?.customer_name} vers un nouveau véhicule.
            </DialogDescriptionUI>
          </DialogHeader>

          <form onSubmit={handleSwapCar} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Old Car Status */}
              <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                  <CarIcon className="w-4 h-4" /> Véhicule Actuel (RETOUR)
                </h3>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
                  <div className="font-bold text-lg">{selectedRental?.brand} {selectedRental?.model}</div>
                  <div className="text-sm font-mono text-slate-500">{selectedRental?.registration}</div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Kilométrage au retour <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      value={swappingData.old_car_return_mileage}
                      onChange={e => setSwappingData({...swappingData, old_car_return_mileage: e.target.value})}
                      className="h-11 rounded-xl"
                      placeholder="Ex: 50200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <FuelBarsSelector 
                      label="Niveau Carburant (RETOUR)"
                      total={parseInt(selectedRental?.fuel_total_bars || cars.find(c => c.id === selectedRental?.car_id)?.fuel_total_bars || "8") || 8}
                      value={swappingData.old_car_return_fuel}
                      onChange={v => setSwappingData({...swappingData, old_car_return_fuel: v})}
                    />
                  </div>
                </div>
              </div>

              {/* New Car Selection */}
              <div className="space-y-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-800 uppercase tracking-wider text-sm flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Nouveau Véhicule (DEPART)
                </h3>
                
                <div className="space-y-4">
                  {/* Select Local/Branch to Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Filtrer par agence / local</Label>
                    <Select 
                      value={swapBranchFilter} 
                      onValueChange={setSwapBranchFilter}
                    >
                      <SelectTrigger 
                        className="h-11 rounded-xl bg-white border-slate-200"
                        showClear={swapBranchFilter !== "all" && swapBranchFilter !== ""}
                        onClear={() => setSwapBranchFilter("all")}
                      >
                        <SelectValue placeholder="Tous les locaux" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tous les locaux</SelectItem>
                        {branches.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.agency_name ? `${b.agency_name} - ${b.name}` : b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Sélectionner la nouvelle voiture <span className="text-red-500">*</span></Label>
                    <Select 
                      value={swappingData.new_car_id}
                      onValueChange={v => {
                        const car = cars.find(c => c.id.toString() === v);
                        setSwappingData({
                          ...swappingData,
                          new_car_id: v,
                          new_car_start_mileage: car?.mileage?.toString() || "",
                          new_car_start_fuel: 0, // MUST BE EMPTY (0) as requested!
                          daily_price: "" // Empty by default as requested
                        });
                      }}
                    >
                      <SelectTrigger 
                        className="h-11 rounded-xl bg-white border-slate-200"
                        showClear={!!swappingData.new_car_id}
                        onClear={() => setSwappingData({
                          ...swappingData,
                          new_car_id: "",
                          new_car_start_mileage: "",
                          new_car_start_fuel: 0,
                          daily_price: ""
                        })}
                      >
                        <SelectValue placeholder="Choisir un véhicule disponible" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px] overflow-y-auto">
                        {getAvailableCars(
                          swappingData.swap_date, 
                          selectedRental?.end_date, 
                          swapBranchFilter, 
                          selectedRental?.id
                        )
                        .filter(c => c.id !== selectedRental?.car_id)
                        .map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.brand} {c.model} ({c.registration})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Kilométrage au départ <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      value={swappingData.new_car_start_mileage}
                      onChange={e => setSwappingData({...swappingData, new_car_start_mileage: e.target.value})}
                      className="h-11 rounded-xl"
                      placeholder="KM au départ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const selectedNewCar = cars.find(c => c.id.toString() === swappingData.new_car_id);
                      const totalBars = parseInt(selectedNewCar?.fuel_total_bars || "8") || 8;
                      return (
                        <FuelBarsSelector 
                          label="Niveau Carburant (DEPART)"
                          total={totalBars}
                          value={swappingData.new_car_start_fuel}
                          onChange={v => setSwappingData({...swappingData, new_car_start_fuel: v})}
                        />
                      );
                    })()}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Nouveau prix de location journalier (DT) <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number"
                      step="any"
                      value={swappingData.daily_price || "0"}
                      onChange={e => setSwappingData({...swappingData, daily_price: e.target.value})}
                      className="h-11 rounded-xl font-bold text-indigo-900 bg-indigo-50/10 border-indigo-200"
                      placeholder="Ex: 80"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Pricing Preview */}
            {(() => {
              const { days, total } = calculateSwapPrice(swappingData.daily_price);
              const paid = parseFloat(selectedRental?.amount_paid || "0") || 0;
              const remaining = parseFloat((total - paid).toFixed(3));
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-500" />
                    Aperçu financier mis à jour
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-white rounded-xl border border-slate-150">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Durée totale</div>
                      <div className="text-lg font-extrabold text-slate-800">{days} Jour(s)</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-150">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tarif original</div>
                      <div className="text-lg font-extrabold text-slate-500">{selectedRental?.daily_price} DT</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-indigo-150 bg-indigo-50/10">
                      <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Nouveau tarif</div>
                      <div className="text-lg font-extrabold text-indigo-700">{swappingData.daily_price || 0} DT</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-150 bg-emerald-50/10">
                      <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-semibold">Nouveau total (TTC)</div>
                      <div className="text-lg font-extrabold text-emerald-700">{total.toFixed(3)} DT</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-sm">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold">Déjà payé :</span>{' '}
                        <span className="font-bold text-slate-700">{paid.toFixed(3)} DT</span>
                      </div>
                      {parseFloat(swappingData.new_payment || "0") > 0 && (
                        <div>
                          <span className="text-xs text-slate-400 font-semibold text-emerald-600">Nouveau versement :</span>{' '}
                          <span className="font-bold text-emerald-600">+{parseFloat(swappingData.new_payment || "0").toFixed(3)} DT</span>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-slate-400 font-semibold">Frais suppl. (2 DT/j) :</span>{' '}
                        <span className="font-bold text-slate-700">{(2.0 * days).toFixed(3)} DT</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-sm text-slate-600">Nouveau Solde :</span>
                      {(() => {
                        const addedPayment = parseFloat(swappingData.new_payment || "0") || 0;
                        const finalRemaining = parseFloat((total - (paid + addedPayment)).toFixed(3));
                        return finalRemaining >= 0 ? (
                          <Badge className="bg-rose-50 text-rose-700 border border-rose-150 font-black px-3 py-1 rounded-lg text-sm">
                            Reste à payer : {finalRemaining.toFixed(3)} DT
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-150 font-black px-3 py-1 rounded-lg text-sm">
                            Crédit client : {Math.abs(finalRemaining).toFixed(3)} DT
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* PAYMENT REGISTRATION PANEL - NEW PAYMENT SECTION AS REQUESTED */}
            {(() => {
              const { total } = calculateSwapPrice(swappingData.daily_price);
              const paid = selectedRental?.amount_paid || 0;
              const remainingToPay = Math.max(0, parseFloat((total - paid).toFixed(3)));
              
              return (
                <div className="bg-indigo-50/20 p-5 rounded-2xl border border-indigo-100 space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    Règlement du solde (Facultatif)
                  </h4>
                  <p className="text-slate-500 text-xs">Saisissez un paiement si le client règle tout ou partie du solde restant immédiatement lors du changement de véhicule.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="swap_new_payment" className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Montant versé (DT)</Label>
                        {remainingToPay > 0 && (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="swap_pay_all"
                              checked={swappingData.pay_all || false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSwappingData({ ...swappingData, new_payment: remainingToPay.toFixed(3), pay_all: true });
                                } else {
                                  setSwappingData({ ...swappingData, new_payment: "0", pay_all: false });
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <label 
                              htmlFor="swap_pay_all" 
                              className="text-xs font-black text-indigo-700 hover:text-indigo-950 cursor-pointer flex items-center gap-1"
                            >
                              Tout payer ({remainingToPay.toFixed(3)} DT)
                            </label>
                          </div>
                        )}
                      </div>
                      <Input 
                        id="swap_new_payment"
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="0.000"
                        value={swappingData.new_payment || "0"}
                        onChange={(e) => setSwappingData({ ...swappingData, new_payment: e.target.value, pay_all: false })}
                        className="rounded-xl h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-extrabold text-base text-green-700 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="swap_new_payment_mode" className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Mode de paiement du versement</Label>
                      <Select 
                        value={swappingData.new_payment_mode || "Espèces"} 
                        onValueChange={(v) => setSwappingData({ ...swappingData, new_payment_mode: v })}
                      >
                        <SelectTrigger 
                          className="h-11 bg-white border-slate-200 rounded-xl focus:ring-indigo-500 font-semibold shadow-sm"
                          showClear={!!swappingData.new_payment_mode}
                          onClear={() => setSwappingData({ ...swappingData, new_payment_mode: "" })}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl shadow-xl">
                          <SelectItem value="Espèces">Espèces</SelectItem>
                          <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                          <SelectItem value="Chèque">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-600">Date du changement <span className="text-red-500">*</span></Label>
              <Input 
                type="date" 
                value={swappingData.swap_date}
                onChange={e => setSwappingData({...swappingData, swap_date: e.target.value})}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-600">Raison du changement (Optionnel)</Label>
              <Input 
                value={swappingData.swap_reason}
                onChange={e => setSwappingData({...swappingData, swap_reason: e.target.value})}
                className="h-11 rounded-xl"
                placeholder="Ex: Panne mécanique, demande client..."
              />
            </div>

            <DialogFooter className="pt-8 border-t flex gap-4">
              <Button type="button" variant="ghost" onClick={() => setIsSwapOpen(false)} className="h-12 rounded-xl px-8 font-bold text-slate-500">Annuler</Button>
              <Button type="submit" className="h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-10 font-bold shadow-lg shadow-amber-100">Confirmer le changement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!customerAlertObservation} onOpenChange={() => setCustomerAlertObservation(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border-none shadow-2xl bg-white text-center">
          <DialogHeader className="flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-rose-700">
              Attention : Problème Client !
            </DialogTitle>
            <DialogDescriptionUI className="text-slate-500 font-medium mt-1">
              Le client <span className="font-extrabold text-rose-900">{alertCustomerName}</span> possède une observation enregistrée dans son profil.
            </DialogDescriptionUI>
          </DialogHeader>

          <div className="my-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-slate-700 font-semibold text-lg text-center whitespace-pre-wrap dir-auto">
            {customerAlertObservation}
          </div>

          <DialogFooter className="flex justify-center sm:justify-center">
            <Button 
              type="button"
              onClick={() => setCustomerAlertObservation(null)} 
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-8 font-bold h-12 shadow-lg shadow-rose-100 transition-all hover:scale-102"
            >
              Je comprends et je suis conscient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto rounded-xl p-0 border-none shadow-2xl bg-white">
          {selectedRental && (() => {
            const rentalCust = selectedRental.customer_id ? customers.find(c => c.id.toString() === selectedRental.customer_id.toString()) : null;
            const rentalCustName = rentalCust 
              ? (rentalCust.type === 'company' ? rentalCust.name : `${rentalCust.name || ""} ${rentalCust.first_name || ""}`.trim())
              : (selectedRental.driver_name || selectedRental.customer_name);
            return (
              <>
                <DialogHeader className="p-8 border-b bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-3xl font-black flex items-center gap-3 text-slate-900">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Contrat de Location #{selectedRental.id}
                      </DialogTitle>
                      <DialogDescriptionUI className="text-lg font-medium text-slate-500 mt-1">
                        {rentalCustName} • {selectedRental.brand} {selectedRental.model}
                      </DialogDescriptionUI>
                    </div>
                    <Badge className={cn(
                      "rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest shadow-sm",
                      selectedRental.status === 'active' 
                        ? "bg-green-100 text-green-700 border border-green-200" 
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    )}>
                      {selectedRental.status === 'active' ? "En cours" : "Terminé"}
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="p-8 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Client Info Card */}
                    <div className="space-y-6 p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4">
                        <User className="w-4 h-4 text-blue-500" /> Conducteur Principal
                      </h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nom complet</span>
                          <span className="text-base font-bold text-slate-800">{rentalCustName}</span>
                        </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Téléphone</span>
                        <span className="text-base font-bold text-slate-800">{selectedRental.customer_phone}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CIN / Passeport</span>
                        <span className="text-base font-bold text-slate-800">{selectedRental.customer_id_number}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">N° Permis</span>
                        <span className="text-base font-bold text-slate-800">{selectedRental.customer_license_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Second Driver Card */}
                  {selectedRental.second_driver_name ? (
                    <div className="space-y-6 p-8 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-indigo-100 pb-4">
                        <Users className="w-4 h-4 text-indigo-500" /> Second Conducteur
                      </h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Nom complet</span>
                          <span className="text-base font-bold text-indigo-900">{selectedRental.second_driver_name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Téléphone</span>
                          <span className="text-base font-bold text-indigo-900">{selectedRental.second_driver_phone}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">CIN / Passeport</span>
                          <span className="text-base font-bold text-indigo-900">{selectedRental.second_driver_id_number}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">N° Permis</span>
                          <span className="text-base font-bold text-indigo-900">{selectedRental.second_driver_license_number}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                      <Users className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">Pas de 2ème conducteur</span>
                    </div>
                  )}

                  {/* Vehicle & Period Card */}
                  <div className="space-y-6 p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4">
                      <CarIcon className="w-4 h-4 text-blue-500" /> Véhicule & Période
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Voiture</span>
                        <span className="text-base font-bold text-slate-800">{selectedRental.brand} {selectedRental.model} ({selectedRental.registration})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Année</span>
                          <span className="font-bold text-slate-800">{selectedRental.year || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Couleur</span>
                          <span className="font-bold text-slate-800">{selectedRental.color || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Puissance</span>
                          <span className="font-bold text-slate-800">{selectedRental.power || 'N/A'} CV</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Places</span>
                          <span className="font-bold text-slate-800">{selectedRental.seats || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Transmission</span>
                          <span className="font-bold text-slate-800">{selectedRental.transmission || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carburant</span>
                          <span className="font-bold text-slate-800">{selectedRental.fuel_type || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">État Carburant</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-slate-600">{selectedRental.fuel_depart_bars}/{selectedRental.fuel_total_bars} barres</span>
                          <div className="flex gap-0.5 h-3">
                            {[...Array(parseInt(selectedRental.fuel_total_bars || "8"))].map((_, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "w-1.5 rounded-full",
                                  i < parseInt(selectedRental.fuel_depart_bars || "0") ? "bg-orange-500" : "bg-slate-200"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">KM au départ</span>
                        <span className="text-base font-bold text-slate-800">{selectedRental.km_depart} km</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prix Total</span>
                        <span className="text-xl font-black text-blue-600">{selectedRental.total_price} DT</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photos Section */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
                    <ImageIcon className="w-6 h-6 text-blue-600" /> Photos de l'état (Départ)
                  </h3>
                  {selectedRental.state_photos && JSON.parse(selectedRental.state_photos).length > 0 ? (
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {JSON.parse(selectedRental.state_photos).map((photo: string, i: number) => (
                        <div key={i} className="min-w-[200px] h-[150px] rounded-2xl overflow-hidden border-4 border-white shadow-xl hover:scale-105 transition-transform cursor-zoom-in shrink-0">
                          <img src={photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                      <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune photo disponible pour ce contrat</p>
                    </div>
                  )}
                </div>

                {/* Return Details Section */}
                {selectedRental.status === 'completed' && (
                  <div className="space-y-8 pt-12 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-green-700 uppercase tracking-[0.2em] flex items-center gap-3">
                        <RotateCcw className="w-6 h-6" /> Détails du retour
                      </h3>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">KM Parcourus</span>
                        <span className="text-2xl font-black text-green-600">{selectedRental.km_parcouru} km</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6 p-8 bg-green-50/30 rounded-2xl border border-green-100">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">Date de retour</span>
                            <span className="text-base font-bold text-slate-800">{selectedRental.return_date}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">KM au retour</span>
                            <span className="text-base font-bold text-slate-800">{selectedRental.return_mileage} km</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Photos de l'état (Retour)</span>
                        {selectedRental.return_photos && JSON.parse(selectedRental.return_photos).length > 0 ? (
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                            {JSON.parse(selectedRental.return_photos).map((photo: string, i: number) => (
                              <div key={i} className="min-w-[150px] h-[100px] rounded-xl overflow-hidden border-2 border-white shadow-lg hover:scale-105 transition-transform shrink-0">
                                <img src={photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic font-medium">Aucune photo enregistrée au retour</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-8 border-t">
                  <Button onClick={() => setIsDetailsOpen(false)} className="h-12 rounded-xl px-12 font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-xl">Fermer</Button>
                </DialogFooter>
              </div>
            </>
          )})()}
        </DialogContent>
      </Dialog>

      {isEditOpen && editingRental && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setIsEditOpen(false)} 
              className="h-11 px-4 rounded-xl hover:bg-slate-100 flex items-center justify-center font-bold"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Retour à la liste
            </Button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Modifier la Location</h1>
          </div>

          <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
            <div className="p-8 border-b bg-slate-50">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Edit2 className="w-8 h-8 text-blue-600" />
                Modifier la Location
              </h2>
              <p className="text-slate-500 text-lg font-medium">Mise à jour du contrat de location #{editingRental.id}</p>
            </div>

            <form onSubmit={handleUpdateRental} className="p-8 space-y-12">
                {/* Section: Client */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                    <User className="w-6 h-6 text-blue-600" /> Sélection du Client (Contractant)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Choisir le client <span className="text-red-500">*</span></Label>
                      <Select 
                        value={editingRental.customer_id?.toString() || ""} 
                        onValueChange={(v) => {
                          const cust = customers.find(c => c.id.toString() === v);
                          if (cust) {
                            if (cust.observation && cust.observation.trim() !== "") {
                              setCustomerAlertObservation(cust.observation);
                              setAlertCustomerName(`${cust.name || ""} ${cust.first_name || ""}`.trim());
                            }
                            const isIndividual = cust.type === 'individual';
                            const driverInfo = isIndividual ? {
                              customer_name: `${cust.name || ""} ${cust.first_name || ""}`.trim(),
                              customer_phone: cust.phone || "",
                              customer_id_type: cust.id_type || "CIN",
                              customer_id_number: cust.id_number || "",
                              customer_id_issued_date: cust.id_issued_date || "",
                              customer_id_issued_at: cust.id_issued_place || "",
                              customer_birth_date: cust.birth_date || "",
                              customer_birth_place: cust.birth_place || "",
                              customer_address: cust.address || "",
                              customer_profession: cust.profession || "",
                              customer_license_number: cust.license_number || "",
                              customer_license_issued_date: cust.license_issued_date || "",
                              customer_license_issued_at: cust.license_issued_place || "",
                            } : {
                              customer_name: cust.name || "",
                              customer_phone: cust.phone || "",
                              customer_id_type: "CIN",
                              customer_id_number: cust.id_number || "",
                              customer_id_issued_date: cust.id_issued_date || "",
                              customer_id_issued_at: cust.id_issued_place || "",
                              customer_birth_date: "",
                              customer_birth_place: "",
                              customer_address: cust.address || "",
                              customer_profession: "",
                              customer_license_number: "",
                              customer_license_issued_date: "",
                              customer_license_issued_at: "",
                            };

                            setEditingRental(prev => ({
                              ...prev,
                              customer_id: v,
                              customer_type: cust.type,
                              is_client_first_driver: isIndividual,
                              ...(cust.type === 'company' ? { driver_id: "" } : {}),
                              ...driverInfo
                            }));
                          }
                        }}
                      >
                        <SelectTrigger 
                          className="h-12 rounded-xl text-lg bg-white border-slate-200"
                          showClear={!!editingRental.customer_id}
                          onClear={() => {
                            setEditingRental({
                              ...editingRental,
                              customer_id: "",
                              customer_type: "",
                              is_client_first_driver: false,
                              customer_name: "",
                              customer_phone: "",
                              customer_id_type: "CIN",
                              customer_id_number: "",
                              customer_id_issued_date: "",
                              customer_id_issued_at: "",
                              customer_birth_date: "",
                              customer_birth_place: "",
                              customer_address: "",
                              customer_profession: "",
                              customer_license_number: "",
                              customer_license_issued_date: "",
                              customer_license_issued_at: "",
                              driver_id: ""
                            });
                          }}
                        >
                          <SelectValue placeholder="Rechercher par nom...">
                            {editingRental.customer_id && customers.find(c => c.id.toString() === editingRental.customer_id.toString()) ? (
                              (() => {
                                const c = customers.find(c => c.id.toString() === editingRental.customer_id.toString());
                                return c.type === 'company' ? c.name : `${c.name} ${c.first_name}`;
                              })()
                            ) : null}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.type === 'company' ? `[ENTREPRISE] ${c.name}` : `${c.name} ${c.first_name}`} - {c.id_number || 'N/A'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-11 rounded-xl border-dashed border-2 px-6 text-blue-600 font-bold"
                        onClick={() => navigate("/customers")}
                      >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Gérer les Clients
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                    <ShieldCheck className="w-6 h-6 text-blue-600" /> Informations Conducteur Principal
                  </h3>
                  
                  {!editingRental.is_client_first_driver && (
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-600">Changer conducteur principal depuis la liste</Label>
                        <Select 
                          value={editingRental.driver_id?.toString() || ""}
                          onValueChange={(v) => {
                            const cust = customers.find(c => c.id.toString() === v);
                            if (cust) {
                              if (cust.observation && cust.observation.trim() !== "") {
                                setCustomerAlertObservation(cust.observation);
                                setAlertCustomerName(`${cust.name || ""} ${cust.first_name || ""}`.trim());
                              }
                              setEditingRental(prev => {
                                const mainContractor = customers.find(c => c.id.toString() === prev.customer_id?.toString());
                                const isCorp = mainContractor?.type === 'company' || prev.customer_type === 'company';
                                return {
                                  ...prev,
                                  driver_id: v,
                                  customer_name: isCorp && mainContractor ? mainContractor.name : `${cust.name || ""} ${cust.first_name || ""}`.trim(),
                                  customer_phone: isCorp && mainContractor ? mainContractor.phone || "" : cust.phone || "",
                                  customer_id_type: isCorp && mainContractor ? mainContractor.id_type || "CIN" : cust.id_type || "CIN",
                                  customer_id_number: isCorp && mainContractor ? mainContractor.id_number || "" : cust.id_number || "",
                                  customer_id_issued_date: isCorp && mainContractor ? mainContractor.id_issued_date || "" : cust.id_issued_date || "",
                                  customer_id_issued_at: isCorp && mainContractor ? mainContractor.id_issued_place || "" : cust.id_issued_place || "",
                                  customer_birth_date: isCorp ? "" : cust.birth_date || "",
                                  customer_birth_place: isCorp ? "" : cust.birth_place || "",
                                  customer_address: isCorp && mainContractor ? mainContractor.address || "" : cust.address || "",
                                  customer_license_number: cust.license_number || "",
                                  customer_license_issued_date: cust.license_issued_date || "",
                                  customer_license_issued_at: cust.license_issued_place || "",
                                };
                              });
                            }
                          }}
                        >
                          <SelectTrigger 
                            className="h-11 rounded-xl bg-white border-slate-200"
                            showClear={!!editingRental.driver_id}
                            onClear={() => {
                              setEditingRental({
                                ...editingRental,
                                driver_id: "",
                                customer_name: "",
                                customer_phone: "",
                                customer_id_type: "CIN",
                                customer_id_number: "",
                                customer_id_issued_date: "",
                                customer_id_issued_at: "",
                                customer_birth_date: "",
                                customer_birth_place: "",
                                customer_address: "",
                                customer_profession: "",
                                customer_license_number: "",
                                customer_license_issued_date: "",
                                customer_license_issued_at: "",
                              });
                            }}
                          >
                            <SelectValue placeholder="Sélectionner un conducteur...">
                              {editingRental.driver_id && customers.find(c => c.id.toString() === editingRental.driver_id) ? (
                                (() => {
                                  const c = customers.find(c => c.id.toString() === editingRental.driver_id);
                                  return `${c.name} ${c.first_name}`;
                                })()
                              ) : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[350px]">
                            <div className="p-2 sticky top-0 bg-white z-10 border-b">
                              <Input 
                                placeholder="Chercher conducteur..."
                                value={primaryDriverSearch}
                                onChange={(e) => setPrimaryDriverSearch(e.target.value)}
                                className="h-9 text-sm"
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                            {customers
                              .filter(c => {
                                const isIndiv = c.type === 'individual';
                                const isNotSecond = c.id.toString() !== editingRental.second_driver_id?.toString();
                                if (!isIndiv || !isNotSecond) return false;
                                if (!primaryDriverSearch) return true;
                                const s = primaryDriverSearch.toLowerCase();
                                return (
                                  c.name.toLowerCase().includes(s) ||
                                  (c.first_name || "").toLowerCase().includes(s) ||
                                  (c.id_number || "").toLowerCase().includes(s) ||
                                  c.phone.includes(primaryDriverSearch)
                                );
                              })
                              .map(c => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.name} {c.first_name} - {c.id_number || 'N/A'}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        {/* En entreprise : coordonnées du conducteur choisi pour l'édition */}
                        {((editingRental.customer_type === 'company' || (editingRental.customer_id && customers.find(c => c.id.toString() === editingRental.customer_id.toString())?.type === 'company'))) && editingRental.driver_id && (
                          (() => {
                            const selectedDriverCust = customers.find(c => c.id.toString() === editingRental.driver_id?.toString());
                            if (!selectedDriverCust) return null;
                            return (
                              <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-200/60 space-y-3">
                                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-200/50 pb-1 flex items-center gap-2">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                  Coordonnées du Conducteur Sélectionné
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-slate-500 block">Nom complet</span>
                                    <span className="font-bold text-slate-800">{selectedDriverCust.name} {selectedDriverCust.first_name}</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-slate-500 block">N° CIN / Passeport</span>
                                    <span className="font-bold text-slate-800">{selectedDriverCust.id_number || "—"}</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-slate-500 block">Téléphone / N° Permis</span>
                                    <span className="font-bold text-slate-800">
                                      {selectedDriverCust.phone || "—"} {selectedDriverCust.license_number ? `(Permis: ${selectedDriverCust.license_number})` : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Nom complet <span className="text-red-500">*</span></Label>
                      <Input value={editingRental.customer_name || ""} onChange={e => setEditingRental({...editingRental, customer_name: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Téléphone (8 chiffres)</Label>
                      <Input value={editingRental.customer_phone || ""} onChange={e => setEditingRental({...editingRental, customer_phone: e.target.value.replace(/[^\d]/g, '')})} className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500" maxLength={8} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Type de pièce</Label>
                      <Select value={editingRental.customer_id_type || "CIN"} onValueChange={v => setEditingRental({...editingRental, customer_id_type: v})}>
                        <SelectTrigger 
                          className="h-12 rounded-xl text-lg bg-white border-slate-200"
                          showClear={!!editingRental.customer_id_type}
                          onClear={() => setEditingRental({...editingRental, customer_id_type: ""})}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CIN">CIN</SelectItem>
                          <SelectItem value="Passeport">Passeport</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">N° CIN/Passeport</Label>
                      <Input value={editingRental.customer_id_number || ""} onChange={e => setEditingRental({...editingRental, customer_id_number: e.target.value.replace(/[^\w]/g, '')})} className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500" maxLength={20} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Délivrée le</Label>
                      <Input type="date" value={editingRental.customer_id_issued_date || ""} onChange={e => setEditingRental({...editingRental, customer_id_issued_date: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">À (Lieu)</Label>
                      <Input value={editingRental.customer_id_issued_at || ""} onChange={e => setEditingRental({...editingRental, customer_id_issued_at: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Né le</Label>
                      <Input type="date" value={editingRental.customer_birth_date || ""} onChange={e => setEditingRental({...editingRental, customer_birth_date: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">N° Permis</Label>
                      <Input value={editingRental.customer_license_number || ""} onChange={e => setEditingRental({...editingRental, customer_license_number: e.target.value.replace(/[^\w/\-]/g, '')})} className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Délivré le (Permis)</Label>
                      <Input type="date" value={editingRental.customer_license_issued_date || ""} onChange={e => setEditingRental({...editingRental, customer_license_issued_date: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">À (Lieu)</Label>
                      <Input value={editingRental.customer_license_issued_at || ""} onChange={e => setEditingRental({...editingRental, customer_license_issued_at: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-8 pt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="edit_age_check" checked={editingRental.min_age_confirmed} onChange={e => setEditingRental({...editingRental, min_age_confirmed: e.target.checked})} className="w-6 h-6 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500" />
                      <Label htmlFor="edit_age_check" className="text-base font-bold cursor-pointer text-slate-700">Age minimum exigé 25 ans</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="edit_license_check" checked={editingRental.license_duration_confirmed} onChange={e => setEditingRental({...editingRental, license_duration_confirmed: e.target.checked})} className="w-6 h-6 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500" />
                      <Label htmlFor="edit_license_check" className="text-base font-bold cursor-pointer text-slate-700">Permis délivré depuis au moins 2 ans</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="edit_has_second_driver" checked={editingRental.has_second_driver} onChange={e => setEditingRental({...editingRental, has_second_driver: e.target.checked})} className="w-6 h-6 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500" />
                      <Label htmlFor="edit_has_second_driver" className="text-base font-bold cursor-pointer text-slate-700">2ème conducteur</Label>
                    </div>
                  </div>
                </div>

                {/* Section: Second Conducteur */}
                {editingRental.has_second_driver && (
                  <div className="space-y-6 p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-200 pb-3">
                      <h3 className="text-xl font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-3">
                        <Users className="w-6 h-6 text-indigo-600" /> Informations Second Conducteur
                      </h3>
                      <div className="w-full md:w-[300px]">
                        <Select 
                          value={editingRental.second_driver_id?.toString() || ""}
                          onValueChange={(v) => {
                            const cust = customers.find(c => c.id.toString() === v);
                            if (cust) {
                              if (cust.observation && cust.observation.trim() !== "") {
                                setCustomerAlertObservation(cust.observation);
                                setAlertCustomerName(cust.type === 'company' ? cust.name : `${cust.name || ""} ${cust.first_name || ""}`.trim());
                              }
                              setEditingRental({
                                ...editingRental,
                                second_driver_id: v,
                                second_driver_name: cust.type === 'company' ? cust.name : `${cust.name} ${cust.first_name}`,
                                second_driver_phone: cust.phone,
                                second_driver_id_number: cust.id_number || "",
                                second_driver_id_issued_date: cust.id_issued_date || "",
                                second_driver_id_issued_at: cust.id_issued_place || "",
                                second_driver_birth_date: cust.birth_date || "",
                                second_driver_birth_place: cust.birth_place || "",
                                second_driver_address: cust.address || "",
                                second_driver_profession: cust.profession || "",
                                second_driver_license_number: cust.license_number || "",
                                second_driver_license_issued_date: cust.license_issued_date || "",
                                second_driver_license_issued_at: cust.license_issued_place || "",
                              });
                            }
                          }}
                        >
                          <SelectTrigger 
                            className="h-10 rounded-xl bg-white border-indigo-200"
                            showClear={!!editingRental.second_driver_id}
                            onClear={() => setEditingRental({
                              ...editingRental,
                              second_driver_id: "",
                              second_driver_name: "",
                              second_driver_phone: "",
                              second_driver_id_number: "",
                              second_driver_id_issued_date: "",
                              second_driver_id_issued_at: "",
                              second_driver_birth_date: "",
                              second_driver_birth_place: "",
                              second_driver_address: "",
                              second_driver_profession: "",
                              second_driver_license_number: "",
                              second_driver_license_issued_date: "",
                              second_driver_license_issued_at: "",
                            })}
                          >
                            <SelectValue placeholder="Choisir depuis la liste...">
                              {editingRental.second_driver_id && customers.find(c => c.id.toString() === editingRental.second_driver_id) ? (
                                (() => {
                                  const c = customers.find(c => c.id.toString() === editingRental.second_driver_id);
                                  return `${c.name} ${c.first_name}`;
                                })()
                              ) : null}
                            </SelectValue>
                          </SelectTrigger>
                        <SelectContent className="max-h-[350px]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input 
                              placeholder="Chercher..."
                              value={secondDriverSearch}
                              onChange={(e) => setSecondDriverSearch(e.target.value)}
                              className="h-9 text-sm"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {customers
                            .filter(c => {
                               const isIndividual = c.type === 'individual';
                               const primaryDriverId = editingRental.is_client_first_driver ? editingRental.customer_id : editingRental.driver_id;
                               const isNotPrimary = c.id.toString() !== primaryDriverId?.toString();
                               if (!isIndividual || !isNotPrimary) return false;
                               if (!secondDriverSearch) return true;
                               const s = secondDriverSearch.toLowerCase();
                               return (
                                 c.name.toLowerCase().includes(s) ||
                                 (c.first_name || "").toLowerCase().includes(s) ||
                                 (c.id_number || "").toLowerCase().includes(s) ||
                                 c.phone.includes(secondDriverSearch)
                               );
                            })
                            .map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} {c.first_name} - {c.id_number || 'N/A'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">Nom complet</Label>
                        <Input value={editingRental.second_driver_name || ""} onChange={e => setEditingRental({...editingRental, second_driver_name: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">Téléphone (8 chiffres)</Label>
                        <Input value={editingRental.second_driver_phone || ""} onChange={e => setEditingRental({...editingRental, second_driver_phone: e.target.value.replace(/[^\d]/g, '')})} className="h-12 rounded-xl text-lg bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500" maxLength={8} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">N° CIN/Passeport (8 chiffres)</Label>
                        <Input value={editingRental.second_driver_id_number || ""} onChange={e => setEditingRental({...editingRental, second_driver_id_number: e.target.value.replace(/[^\w]/g, '')})} className="h-12 rounded-xl text-lg bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500" maxLength={8} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">Délivrée le</Label>
                        <Input type="date" value={editingRental.second_driver_id_issued_date || ""} onChange={e => setEditingRental({...editingRental, second_driver_id_issued_date: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-indigo-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">À (Lieu)</Label>
                        <Input value={editingRental.second_driver_id_issued_at || ""} onChange={e => setEditingRental({...editingRental, second_driver_id_issued_at: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-indigo-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">Né le</Label>
                        <Input type="date" value={editingRental.second_driver_birth_date || ""} onChange={e => setEditingRental({...editingRental, second_driver_birth_date: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-indigo-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">N° Permis</Label>
                        <Input value={editingRental.second_driver_license_number || ""} onChange={e => setEditingRental({...editingRental, second_driver_license_number: e.target.value.replace(/[^\w/\-]/g, '')})} className="h-12 rounded-xl text-lg bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">Délivré le (Permis)</Label>
                        <Input type="date" value={editingRental.second_driver_license_issued_date || ""} onChange={e => setEditingRental({...editingRental, second_driver_license_issued_date: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-indigo-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-indigo-700">À (Lieu)</Label>
                        <Input value={editingRental.second_driver_license_issued_at || ""} onChange={e => setEditingRental({...editingRental, second_driver_license_issued_at: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-indigo-200" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section: Véhicule */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                    <CarIcon className="w-6 h-6 text-blue-600" /> Véhicule & Période
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Merged Local de départ */}
                    <div className="space-y-2 relative" id="edit-departure-place-container">
                      <Label className="text-sm font-bold text-slate-600">Local de départ <span className="text-red-500">*</span></Label>
                      <Input 
                        type="text" 
                        value={editingRental.departure_place || ""} 
                        onChange={e => {
                          const val = e.target.value;
                          const matchedBranch = branches.find(b => b.name.toLowerCase() === val.trim().toLowerCase());
                          setEditingRental({
                            ...editingRental, 
                            departure_place: val,
                            branch_id: matchedBranch ? matchedBranch.id.toString() : "",
                            return_place: val
                          });
                        }} 
                        onFocus={() => setShowEditDepartureDropdown(true)}
                        onBlur={() => setTimeout(() => setShowEditDepartureDropdown(false), 200)}
                        required 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200 text-slate-600 placeholder-slate-400" 
                        placeholder="Choisir le local de départ" 
                      />
                      {showEditDepartureDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[250px] overflow-y-auto">
                          {branches
                            .filter(b => b.name.toLowerCase().includes((editingRental.departure_place || "").toLowerCase()))
                            .map(b => (
                              <div
                                key={b.id}
                                className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-slate-700 font-semibold border-b border-slate-100 last:border-none text-sm"
                                onMouseDown={() => {
                                  setEditingRental({
                                    ...editingRental,
                                    branch_id: b.id.toString(),
                                    departure_place: b.name,
                                    return_place: b.name
                                  });
                                  setShowEditDepartureDropdown(false);
                                }}
                              >
                                {b.name}
                              </div>
                            ))}
                          {branches.filter(b => b.name.toLowerCase().includes((editingRental.departure_place || "").toLowerCase())).length === 0 && (
                            <div className="px-4 py-2 text-xs text-slate-400 italic">
                              Saisir en tant que lieu personnalisé
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Date de départ <span className="text-red-500">*</span></Label>
                      <Input type="date" value={editingRental.start_date || ""} onChange={e => setEditingRental({...editingRental, start_date: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <TimeStepSelect 
                      label="Heure de départ" 
                      value={editingRental.departure_time || "08:00"} 
                      onChange={v => setEditingRental({...editingRental, departure_time: v})} 
                      required
                    />
                    <div className="space-y-2 relative" id="edit-return-place-container">
                      <Label className="text-sm font-bold text-slate-600">Lieu de retour <span className="text-red-500">*</span></Label>
                      <Input 
                        type="text" 
                        value={editingRental.return_place || ""} 
                        onChange={e => {
                          const val = e.target.value;
                          setEditingRental({
                            ...editingRental, 
                            return_place: val
                          });
                        }} 
                        onFocus={() => setShowEditReturnDropdown(true)}
                        onBlur={() => setTimeout(() => setShowEditReturnDropdown(false), 200)}
                        required 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200 text-slate-600 placeholder-slate-400" 
                        placeholder="Choisir le lieu de retour" 
                      />
                      {showEditReturnDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[250px] overflow-y-auto">
                          {branches
                            .filter(b => b.name.toLowerCase().includes((editingRental.return_place || "").toLowerCase()))
                            .map(b => (
                              <div
                                key={b.id}
                                className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-slate-700 font-semibold border-b border-slate-100 last:border-none text-sm"
                                onMouseDown={() => {
                                  setEditingRental({
                                    ...editingRental,
                                    return_place: b.name
                                  });
                                  setShowEditReturnDropdown(false);
                                }}
                              >
                                {b.name}
                              </div>
                            ))}
                          {branches.filter(b => b.name.toLowerCase().includes((editingRental.return_place || "").toLowerCase())).length === 0 && (
                            <div className="px-4 py-2 text-xs text-slate-400 italic">
                              Saisir en tant que lieu personnalisé
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Date de retour prévue <span className="text-red-500">*</span></Label>
                      <Input type="date" value={editingRental.end_date || ""} min={editingRental.start_date} onChange={e => setEditingRental({...editingRental, end_date: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <TimeStepSelect 
                      label="Heure de retour" 
                      value={editingRental.return_time || "08:00"} 
                      onChange={v => setEditingRental({...editingRental, return_time: v})} 
                      required
                    />

                    {/* Nombre de jours */}
                    <div className="space-y-2 lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-slate-600">Nombre de jours <span className="text-red-500">*</span></Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="edit_force_days_checkbox"
                            checked={editingRental.is_rental_days_overridden || false}
                            onChange={e => {
                              const checked = e.target.checked;
                              const autoVal = getAutoRentalDays(editingRental).toString();
                              setEditingRental({
                                ...editingRental,
                                is_rental_days_overridden: checked,
                                rental_days: checked ? autoVal : ""
                              });
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <Label htmlFor="edit_force_days_checkbox" className="text-xs font-semibold cursor-pointer text-slate-500">Forcer</Label>
                        </div>
                      </div>
                      <Input
                        type="number"
                        value={editingRental.is_rental_days_overridden ? (editingRental.rental_days || "") : getAutoRentalDays(editingRental)}
                        disabled={!editingRental.is_rental_days_overridden}
                        onChange={e => setEditingRental({...editingRental, rental_days: e.target.value})}
                        required
                        min={1}
                        className="h-12 rounded-xl text-lg bg-white border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 font-bold"
                      />
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Voiture <span className="text-red-500">*</span></Label>
                      <Select 
                        value={editingRental.car_id?.toString() || ""} 
                        onValueChange={v => {
                          const car = cars.find(c => c.id.toString() === v);
                          setEditingRental({
                            ...editingRental, 
                            car_id: v,
                            daily_price: car ? car.daily_price?.toString() || "" : editingRental.daily_price,
                            km_depart: car ? car.mileage?.toString() || "" : editingRental.km_depart,
                            fuel_total_bars: car ? car.fuel_total_bars?.toString() || editingRental.fuel_total_bars : editingRental.fuel_total_bars
                          });
                        }}
                      >
                        <SelectTrigger 
                          className="h-12 bg-white border-slate-200 rounded-xl hover:border-blue-400 transition-all shadow-sm"
                          showClear={!!editingRental.car_id}
                          onClear={() => setEditingRental({
                            ...editingRental,
                            car_id: "",
                            daily_price: "",
                            km_depart: "",
                            fuel_total_bars: "8"
                          })}
                        >
                          <SelectValue placeholder="Sélectionner une voiture">
                            {editingRental.car_id && cars.find(c => c.id.toString() === editingRental.car_id) ? (
                              (() => {
                                const c = cars.find(c => c.id.toString() === editingRental.car_id);
                                return `${c.brand} ${c.model}`;
                              })()
                            ) : null}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl max-h-[350px]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input 
                              placeholder="Chercher par marque, modèle ou matricule..."
                              value={vehicleSearch}
                              onChange={(e) => setVehicleSearch(e.target.value)}
                              className="h-10 text-sm"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {getAvailableCars(editingRental.start_date, editingRental.end_date, editingRental.branch_id, editingRental.id)
                            .filter(c => {
                              if (!vehicleSearch) return true;
                              const s = vehicleSearch.toLowerCase();
                              return (
                                c.brand.toLowerCase().includes(s) ||
                                c.model.toLowerCase().includes(s) ||
                                c.registration.toLowerCase().includes(s)
                              );
                            })
                            .map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                <div className="flex flex-col text-left py-1">
                                  <span className="font-bold">{c.registration} - {c.brand} {c.model}</span>
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <MapPin size={10} /> {c.branch_name || 'Inconnu'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">KM départ <span className="text-red-500">*</span></Label>
                      <Input type="number" value={editingRental.km_depart || ""} onChange={e => setEditingRental({...editingRental, km_depart: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                      <div className="space-y-2">
                        <FuelBarsSelector 
                          label="Niveau de carburant (Départ)"
                          total={parseInt(editingRental.fuel_total_bars || "8")}
                          value={parseInt(editingRental.fuel_depart_bars || "0")}
                          onChange={v => setEditingRental({...editingRental, fuel_depart_bars: v.toString()})}
                        />
                      </div>
                  </div>
                </div>

                {/* Section: Facturation */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-3 border-b border-slate-200 pb-3">
                    <CreditCard className="w-6 h-6 text-blue-600" /> Facturation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Prix par jour (DT)</Label>
                      <Input type="number" value={editingRental.daily_price || ""} onChange={e => setEditingRental({...editingRental, daily_price: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Mode de paiement caution</Label>
                      <Select value={editingRental.payment_mode || "Espèces"} onValueChange={v => setEditingRental({...editingRental, payment_mode: v})}>
                        <SelectTrigger 
                          className="h-12 rounded-xl text-lg bg-white border-slate-200"
                          showClear={!!editingRental.payment_mode}
                          onClear={() => setEditingRental({...editingRental, payment_mode: ""})}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Espèces">Espèces</SelectItem>
                          <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                          <SelectItem value="Chèque">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Montant Caution (DT)</Label>
                      <Input type="number" value={editingRental.deposit_amount || ""} onChange={e => setEditingRental({...editingRental, deposit_amount: e.target.value})} className="h-12 rounded-xl text-lg bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-bold text-slate-600">Montant Payé (DT)</Label>
                        <Button 
                          type="button" 
                          variant="link" 
                          size="sm" 
                          onClick={() => {
                            const total = calculateTotalPrice(editingRental);
                            setEditingRental({...editingRental, amount_paid: total, amount_remaining: "0.000"});
                          }}
                          className="text-xs font-black text-blue-600 hover:text-blue-800 p-0 h-auto"
                        >
                          ✓ Tout payer
                        </Button>
                      </div>
                      <Input 
                        type="number" 
                        value={editingRental.amount_paid || ""} 
                        onChange={e => {
                          const paid = parseFloat(e.target.value || "0");
                          const total = parseFloat(calculateTotalPrice(editingRental));
                          setEditingRental({...editingRental, amount_paid: e.target.value, amount_remaining: (total - paid).toFixed(3)});
                        }} 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Reste à payer (DT)</Label>
                      <Input type="number" value={editingRental.amount_remaining || ""} disabled className="h-12 rounded-xl text-lg bg-slate-50 border-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 flex justify-between items-center text-white">
                  <div>
                    <div className="text-blue-100 text-sm font-bold uppercase tracking-widest">Total Estimé</div>
                    <div className="text-sm text-blue-200">Incluant taxes et frais</div>
                  </div>
                  <div className="text-4xl font-black">{calculateTotalPrice(editingRental)} DT</div>
                </div>

                <div className="pt-8 border-t flex justify-between items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      const original = rentals.find(r => r.id === editingRental.id);
                      if (original) setEditingRental({ ...initialRentalState, ...original });
                    }} 
                    className="h-12 px-8 text-lg rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  >
                    Réinitialiser
                  </Button>
                  <div className="flex gap-4">
                    <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="h-12 px-8 text-lg rounded-xl font-bold">Annuler</Button>
                    <Button type="submit" className="h-12 px-12 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 font-bold">Mettre à jour</Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}

      {isActivationOpen && activationRental && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setIsActivationOpen(false)} 
              className="h-11 px-4 rounded-xl hover:bg-slate-100 flex items-center justify-center font-bold"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Retour à la liste
            </Button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activation du contrat</h1>
          </div>

          <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
            <div className="p-8 border-b bg-amber-50">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-amber-900">
                <Zap className="w-8 h-8 text-amber-600 animate-bounce" />
                Activer et Configurer la Location (Contrat #{activationRental.id})
              </h2>
              <p className="text-slate-600 text-lg font-medium">
                Veuillez valider l'état du véhicule au départ, ajuster le prix, les conducteurs et les dates.
              </p>
            </div>

            <form onSubmit={handleConfirmActivation} className="p-8 space-y-8">
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b-2 pb-2">
                  <CarIcon className="w-5 h-5 text-blue-600" /> Choix du Véhicule & Dates
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {!isCurrentCarAvailableForActivation && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-900 col-span-full">
                      <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse flex-shrink-0" />
                      <div>
                        <span className="font-extrabold">Attention :</span> Ce véhicule est déjà réservé par un autre contrat de location pendant cette période révisée. Veuillez choisir un autre véhicule ou changer de dates d'activation.
                      </div>
                    </div>
                  )}

                  {/* Select Vehicle */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Véhicule de location <span className="text-red-500">*</span></Label>
                    <Select 
                      value={activationRental.car_id || ""} 
                      onValueChange={(val) => {
                        const selCar = cars.find(c => c.id.toString() === val);
                        setActivationRental(prev => ({
                          ...prev,
                          car_id: val,
                          daily_price: selCar?.daily_price?.toString() || prev.daily_price,
                          km_depart: selCar?.mileage?.toString() || prev.km_depart,
                          fuel_depart_bars: "0", // Default to empty as requested
                          fuel_total_bars: selCar?.fuel_total_bars?.toString() || prev.fuel_total_bars
                        }));
                      }}
                    >
                      <SelectTrigger 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200"
                        showClear={!!activationRental.car_id}
                        onClear={() => setActivationRental({
                          ...activationRental,
                          car_id: "",
                          daily_price: "",
                          km_depart: "",
                          fuel_depart_bars: "0",
                          fuel_total_bars: "8"
                        })}
                      >
                        <SelectValue placeholder="Choisir un véhicule...">
                          {(() => {
                            const c = cars.find(car => car.id.toString() === activationRental.car_id?.toString());
                            return c ? `${c.registration} - ${c.brand} ${c.model}` : null;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const list = [...(activationRental ? getAvailableCars(activationRental.start_date, activationRental.end_date, "all", activationRental.id) : [])];
                          const curCar = activationRental ? cars.find(c => c.id.toString() === activationRental.car_id?.toString()) : null;
                          if (curCar && !list.some(c => c.id === curCar.id)) {
                            list.push(curCar);
                          }
                          return list.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.registration} - {c.brand} {c.model}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Date de début <span className="text-red-500">*</span></Label>
                    <Input 
                      type="date" 
                      value={activationRental.start_date} 
                      onChange={e => setActivationRental({ ...activationRental, start_date: e.target.value })} 
                      required 
                      className="h-12 rounded-xl text-lg bg-white border-slate-200" 
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Date de retour prévue <span className="text-red-500">*</span></Label>
                    <Input 
                      type="date" 
                      value={activationRental.end_date} 
                      onChange={e => setActivationRental({ ...activationRental, end_date: e.target.value })} 
                      required 
                      className="h-12 rounded-xl text-lg bg-white border-slate-200" 
                    />
                  </div>

                  {/* Start Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Heure de départ</Label>
                    <Input 
                      type="time" 
                      value={activationRental.departure_time || "08:00"} 
                      onChange={e => setActivationRental({ ...activationRental, departure_time: e.target.value })} 
                      className="h-12 rounded-xl text-lg bg-white border-slate-200" 
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Heure de retour prévue</Label>
                    <Input 
                      type="time" 
                      value={activationRental.return_time || "08:00"} 
                      onChange={e => setActivationRental({ ...activationRental, return_time: e.target.value })} 
                      className="h-12 rounded-xl text-lg bg-white border-slate-200" 
                    />
                  </div>
                </div>
              </div>

              {/* Section: Drivers */}
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b-2 pb-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Gestion des Conducteurs
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Driver */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Conducteur principal <span className="text-red-500">*</span></Label>
                    <Select 
                      value={activationRental.driver_id || ""} 
                      onValueChange={(v) => {
                        const c = customers.find(cust => cust.id.toString() === v);
                        if (c) {
                          setActivationRental({
                            ...activationRental,
                            driver_id: v,
                            customer_name: c.type === 'company' ? c.name : `${c.name} ${c.first_name}`,
                            customer_phone: c.phone || ""
                          });
                        }
                      }}
                    >
                      <SelectTrigger 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200"
                        showClear={!!activationRental.driver_id}
                        onClear={() => setActivationRental({
                          ...activationRental,
                          driver_id: "",
                          customer_name: "",
                          customer_phone: ""
                        })}
                      >
                        <SelectValue placeholder="Choisir le conducteur principal...">
                          {(() => {
                            const c = customers.find(cust => cust.id.toString() === activationRental.driver_id?.toString());
                            return c ? `${c.name} ${c.first_name} - ${c.id_number || "CIN N/A"}` : null;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px] overflow-y-auto">
                        {customers.filter(c => c.type === 'individual').map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name} {c.first_name} - {c.id_number || "CIN N/A"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Second Driver */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Deuxième conducteur (optionnel)</Label>
                    <Select 
                      value={activationRental.second_driver_id || "none"} 
                      onValueChange={(v) => {
                        if (v === "none" || v === "") {
                          setActivationRental({
                            ...activationRental,
                            second_driver_id: ""
                          });
                        } else {
                          const c = customers.find(cust => cust.id.toString() === v);
                          if (c) {
                            setActivationRental({
                              ...activationRental,
                              second_driver_id: v,
                              second_driver_id_number: c.id_number || "",
                              second_driver_id_issued_date: c.id_issued_date || "",
                              second_driver_id_issued_at: c.id_issued_place || "",
                              second_driver_name: `${c.name} ${c.first_name}`,
                              second_driver_phone: c.phone || ""
                            });
                          }
                        }
                      }}
                    >
                      <SelectTrigger 
                        className="h-12 rounded-xl text-lg bg-white border-slate-200"
                        showClear={!!activationRental.second_driver_id && activationRental.second_driver_id !== "none"}
                        onClear={() => setActivationRental({
                          ...activationRental,
                          second_driver_id: "",
                          second_driver_id_number: "",
                          second_driver_id_issued_date: "",
                          second_driver_id_issued_at: "",
                          second_driver_name: "",
                          second_driver_phone: ""
                        })}
                      >
                        <SelectValue placeholder="Aucun deuxième conducteur">
                          {(() => {
                            if (!activationRental.second_driver_id || activationRental.second_driver_id === "none") return "Aucun";
                            const c = customers.find(cust => cust.id.toString() === activationRental.second_driver_id?.toString());
                            return c ? `${c.name} ${c.first_name} - ${c.id_number || "CIN N/A"}` : "Aucun";
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px] overflow-y-auto">
                        <SelectItem value="none">Aucun</SelectItem>
                        {customers.filter(c => c.type === 'individual' && c.id.toString() !== activationRental.driver_id).map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name} {c.first_name} - {c.id_number || "CIN N/A"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section: Handover metrics */}
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b-2 pb-2">
                  <Gauge className="w-5 h-5 text-orange-600" /> Compteur, Carburant & Documents de Départ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mileage */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Kilométrage départ (km)</Label>
                    <Input 
                      type="number" 
                      value={activationRental.km_depart || ""} 
                      onChange={e => setActivationRental({ ...activationRental, km_depart: e.target.value })} 
                      className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-orange-500" 
                    />
                  </div>

                  {/* Fuel bars */}
                  <div className="space-y-2">
                    <FuelBarsSelector 
                      label="Niveau de carburant (Départ)"
                      total={parseInt(activationRental.fuel_total_bars || "8")}
                      value={parseInt(activationRental.fuel_depart_bars || "0")}
                      onChange={v => setActivationRental({ ...activationRental, fuel_depart_bars: v.toString() })}
                    />
                  </div>
                </div>

                {/* State Photos */}
                <div className="space-y-4 pt-4">
                  <Label className="text-sm font-bold text-slate-600 uppercase tracking-wider text-orange-950">Photos de l'état actuel du véhicule (Départ - Max 4)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <label key={i} className="aspect-square border-2 border-dashed border-amber-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all relative overflow-hidden group shadow-sm">
                        <Camera className="w-8 h-8 text-amber-300 group-hover:text-amber-500 transition-colors" />
                        <span className="text-xs font-bold text-slate-400 mt-2 uppercase group-hover:text-amber-700">Photo {i+1}</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const newPhotos = [...(activationRental.state_photos || [])];
                                newPhotos[i] = reader.result as string;
                                setActivationRental({...activationRental, state_photos: newPhotos});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {activationRental.state_photos && activationRental.state_photos[i] && (
                          <img src={activationRental.state_photos[i]} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section: Price & Payments info */}
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b-2 pb-2">
                  <Receipt className="w-5 h-5 text-emerald-600" /> Tarifs, Charges & Règlements
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Daily Price */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Prix journalier (DT)</Label>
                    <Input 
                      type="number" 
                      step="0.001"
                      value={activationRental.daily_price || ""} 
                      onChange={e => setActivationRental({ ...activationRental, daily_price: e.target.value })} 
                      className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-green-500" 
                    />
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-600">Mode de paiement au départ</Label>
                    <Select 
                      value={activationRental.payment_mode || "Espèces"} 
                      onValueChange={v => setActivationRental({ ...activationRental, payment_mode: v })}
                    >
                      <SelectTrigger 
                        className="h-12 bg-white border-slate-200 rounded-xl focus:ring-green-500 font-semibold shadow-sm"
                        showClear={!!activationRental.payment_mode}
                        onClear={() => setActivationRental({ ...activationRental, payment_mode: "" })}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl shadow-xl">
                        <SelectItem value="Espèces">Espèces</SelectItem>
                        <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                        <SelectItem value="Chèque">Chèque</SelectItem>
                        <SelectItem value="Virement">Virement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Paid */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-bold text-slate-600">Montant versé (DT)</Label>
                      <Button 
                        type="button" 
                        variant="link" 
                        size="sm" 
                        onClick={() => {
                          const priceSummary = calculateActivationPrice();
                          setActivationRental(prev => ({ 
                            ...prev, 
                            amount_paid: priceSummary.total.toFixed(3) 
                          }));
                        }}
                        className="text-xs font-black text-emerald-700 hover:text-emerald-950 p-0 h-auto"
                      >
                        ✓ Tout régler
                      </Button>
                    </div>
                    <Input 
                      type="number" 
                      step="0.001"
                      value={activationRental.amount_paid || "0"} 
                      onChange={e => setActivationRental({ ...activationRental, amount_paid: e.target.value })} 
                      className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-green-500" 
                    />
                  </div>
                </div>

                {/* Billing Summary Preview inside Activation */}
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 space-y-3">
                  <h4 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">Aperçu financier de la location</h4>
                  <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <span className="text-slate-600">Durée calculée :</span>
                    <span className="text-right font-bold text-slate-800">{calculateActivationPrice().days} jours</span>

                    <span className="text-slate-600">Sous-total net :</span>
                    <span className="text-right font-semibold text-slate-800">
                      {(calculateActivationPrice().days * parseFloat(activationRental.daily_price || "0")).toFixed(3)} DT
                    </span>

                    <span className="text-slate-600">Frais supplémentaires (Timbre) :</span>
                    <span className="text-right font-semibold text-slate-700">
                      {calculateActivationPrice().stamp_duty?.toFixed(3)} DT
                    </span>

                    <span className="text-emerald-950 font-bold border-t border-emerald-200 pt-2">Total contrat activé :</span>
                    <span className="text-right font-black text-emerald-950 text-base border-t border-emerald-200 pt-2">
                      {calculateActivationPrice().total.toFixed(3)} DT
                    </span>

                    <span className="text-slate-600">Déjà versé :</span>
                    <span className="text-right font-extrabold text-green-700">
                      {parseFloat(activationRental.amount_paid || "0").toFixed(3)} DT
                    </span>

                    <span className="text-red-700 font-extrabold border-t border-dashed border-emerald-200 pt-1">Reste à payer :</span>
                    <span className="text-right font-black text-red-700 pt-1 text-base">
                      {Math.max(0, calculateActivationPrice().total - parseFloat(activationRental.amount_paid || "0")).toFixed(3)} DT
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsActivationOpen(false)} className="h-12 rounded-xl px-8 font-bold text-slate-500 hover:bg-slate-100">Annuler</Button>
                <Button type="submit" className="h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-10 font-bold shadow-lg shadow-amber-200 transition-all hover:scale-[1.02]">Activer & Imprimer le Contrat</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto rounded-xl p-0 border-none shadow-2xl bg-white">
          <DialogHeader className="p-8 border-b bg-green-50">
            <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-green-800">
              <RotateCcw className="w-8 h-8 text-green-600" />
              Retour de Véhicule
            </DialogTitle>
            <DialogDescriptionUI className="text-lg">Enregistrement du retour pour {selectedRental?.customer_name}</DialogDescriptionUI>
          </DialogHeader>

          <form onSubmit={handleReturnCar} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-600">Date de retour <span className="text-red-500">*</span></Label>
                <Input type="date" value={returningRental.return_date || ""} onChange={e => setReturningRental({...returningRental, return_date: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-green-500 focus:ring-green-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-600">Kilométrage au retour <span className="text-red-500">*</span></Label>
                <Input type="number" value={returningRental.return_mileage || ""} onChange={e => setReturningRental({...returningRental, return_mileage: e.target.value})} required className="h-12 rounded-xl text-lg bg-white border-slate-200 focus:border-green-500 focus:ring-green-500" />
              </div>
              <div className="space-y-2">
                <FuelBarsSelector 
                  label="Niveau de carburant (Retour)"
                  total={parseInt(selectedRental?.fuel_total_bars || cars.find(c => c.id === selectedRental?.car_id)?.fuel_total_bars || "8")}
                  value={parseInt(returningRental.fuel_return_bars || "0")}
                  onChange={v => setReturningRental({...returningRental, fuel_return_bars: v.toString()})}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <input 
                  type="checkbox" 
                  id="is_damaged" 
                  checked={returningRental.is_damaged} 
                  onChange={e => setReturningRental({...returningRental, is_damaged: e.target.checked})} 
                  className="w-6 h-6 text-red-600 rounded-lg border-slate-300 focus:ring-red-500" 
                />
                <Label htmlFor="is_damaged" className="text-base font-bold cursor-pointer text-red-700 uppercase tracking-wider">Véhicule Endommagé ?</Label>
              </div>

              {returningRental.is_damaged && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-sm font-bold text-slate-600">Montant à déduire de la caution (DT)</Label>
                    <Input 
                    type="number" 
                    value={returningRental.damage_deduction || "0"} 
                    onChange={e => setReturningRental({...returningRental, damage_deduction: e.target.value})} 
                    className="h-12 rounded-xl text-lg bg-white border-red-200 focus:border-red-500 focus:ring-red-500" 
                    placeholder="0.000"
                  />
                </div>
              )}
            </div>

            {selectedRental && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Kilométrage au départ</span>
                  <span className="font-bold text-slate-700">{selectedRental.km_depart || selectedRental.current_mileage} km</span>
                </div>
                {returningRental.return_mileage && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">KM Parcourus</span>
                      <span className="font-bold text-slate-900">{Number(returningRental.return_mileage) - Number(selectedRental.km_depart || selectedRental.current_mileage)} km</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t pt-3">
                      <span className="text-slate-500 font-medium">Franchise ({selectedRental.km_allowance || 280}km/j)</span>
                      <span className="font-bold text-slate-900">{(Math.max(1, differenceInDays(new Date(returningRental.return_date), new Date(selectedRental.start_date)))) * (selectedRental.km_allowance || 280)} km</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedRental && (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 space-y-4 shadow-sm">
                <h4 className="font-bold text-amber-800 uppercase tracking-wider text-xs">Règlement et Reste à payer (Obligatoire au retour)</h4>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-700">Reste à payer contractuel initial</span>
                  <span className="font-bold text-amber-950">{parseFloat(selectedRental.amount_remaining || "0") > 0 ? parseFloat(selectedRental.amount_remaining || "0").toFixed(3) : "0.000"} DT</span>
                </div>

                {(() => {
                  const days = Math.max(1, differenceInDays(new Date(returningRental.return_date), new Date(selectedRental.start_date)));
                  const actualKm = Number(returningRental.return_mileage || 0) - Number(selectedRental.km_depart || selectedRental.current_mileage);
                  const allowedKm = days * (selectedRental.km_allowance || 280);
                  const excessKm = Math.max(0, actualKm - allowedKm);
                  const excessAmount = excessKm * (selectedRental.excess_km_price || 0.5);
                  
                  const damageDeduction = returningRental.is_damaged ? parseFloat(returningRental.damage_deduction || "0") : 0;
                  const initialRemaining = Math.max(0, parseFloat(selectedRental.amount_remaining || "0"));
                  const totalDueAtReturn = initialRemaining + excessAmount + damageDeduction;

                  return (
                    <>
                      {excessAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-amber-700">Supplément KM ({excessKm} km)</span>
                          <span className="font-bold text-amber-950">{excessAmount.toFixed(3)} DT</span>
                        </div>
                      )}
                      {damageDeduction > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-amber-700">Frais de dégâts / sinistre</span>
                          <span className="font-bold text-amber-950">{damageDeduction.toFixed(3)} DT</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t border-amber-200 mt-2">
                        <span className="font-bold text-amber-900 text-base">TOTAL À RÉGLER AU RETOUR</span>
                        <span className="text-2xl font-black text-amber-950">{totalDueAtReturn.toFixed(3)} DT</span>
                      </div>

                      {totalDueAtReturn > 0 && (
                        <div className="bg-white p-4 rounded-xl border border-amber-200 flex items-start gap-3 mt-4">
                          <input 
                            type="checkbox" 
                            id="confirm_payment_received"
                            checked={confirmReturnPayment}
                            onChange={(e) => setConfirmReturnPayment(e.target.checked)}
                            required
                            className="w-5 h-5 rounded text-amber-600 border-amber-300 focus:ring-amber-500 mt-0.5 cursor-pointer"
                          />
                          <Label htmlFor="confirm_payment_received" className="text-xs font-bold text-amber-900 cursor-pointer select-none leading-snug">
                            Je confirme que le client a réglé le montant obligatoire de {totalDueAtReturn.toFixed(3)} DT lors du retour. <span className="text-red-500">*</span>
                          </Label>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Photos du retour (État du véhicule)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <label key={i} className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all relative overflow-hidden group shadow-sm">
                    <Camera className="w-8 h-8 text-slate-300 group-hover:text-green-500 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 mt-2 uppercase group-hover:text-green-600">Photo {i+1}</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const newPhotos = [...returningRental.return_photos];
                            newPhotos[i] = reader.result as string;
                            setReturningRental({...returningRental, return_photos: newPhotos});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {returningRental.return_photos[i] && (
                      <img src={returningRental.return_photos[i]} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-8 border-t flex gap-4">
              <Button type="button" variant="ghost" onClick={() => setIsReturnOpen(false)} className="h-12 rounded-xl px-8 font-bold text-slate-500 hover:bg-slate-100">Annuler</Button>
              <Button type="submit" className="h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl px-10 font-bold shadow-lg shadow-green-100 transition-all hover:scale-[1.02]">Confirmer le retour</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isExtendOpen && selectedExtendRental && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setIsExtendOpen(false)} 
              className="h-11 px-4 rounded-xl hover:bg-slate-100 flex items-center justify-center font-bold"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Retour à la liste
            </Button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Prolongation de contrat</h1>
          </div>

          <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
            <div className="p-8 border-b bg-amber-50">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-amber-900">
                <PlusCircle className="w-8 h-8 text-amber-600" />
                Extension de contrat
              </h2>
              <p className="text-slate-600 text-lg font-medium">
                Prolongation du contrat de location pour <span className="font-extrabold text-slate-900">{selectedExtendRental.customer_name}</span> (Véhicule: {selectedExtendRental.brand} {selectedExtendRental.model} - {selectedExtendRental.registration})
              </p>
            </div>

            <form onSubmit={handleConfirmExtend} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" /> 1. Dates et Durées
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date de départ (Rappel)</Label>
                      <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-extrabold text-sm shadow-sm">
                        {selectedExtendRental.start_date}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date de retour initiale</Label>
                      <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-extrabold text-sm shadow-sm">
                        {selectedExtendRental.end_date}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="extend_end_date" className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Nouvelle date de retour <span className="text-red-500">*</span></Label>
                      <Input 
                        id="extend_end_date"
                        type="date"
                        required
                        min={selectedExtendRental.start_date}
                        value={extendData.end_date}
                        onChange={(e) => setExtendData({ ...extendData, end_date: e.target.value })}
                        className="rounded-xl h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 font-bold text-base shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="extend_return_time" className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Heure de retour</Label>
                      <Input 
                        id="extend_return_time"
                        type="time"
                        value={extendData.return_time}
                        onChange={(e) => setExtendData({ ...extendData, return_time: e.target.value })}
                        className="rounded-xl h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 font-bold text-base shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" /> 2. Lieux d'opération
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="extend_return_place" className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Lieu de retour</Label>
                      <Input 
                        id="extend_return_place"
                        type="text"
                        placeholder="Lieu de retour"
                        value={extendData.return_place}
                        onChange={(e) => setExtendData({ ...extendData, return_place: e.target.value, prolongation_place: e.target.value })}
                        className="rounded-xl h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 font-semibold text-sm shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="extend_prolongation_place" className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Lieu de prolongation</Label>
                      <Input 
                        id="extend_prolongation_place"
                        type="text"
                        placeholder="Lieu de prolongation"
                        value={extendData.prolongation_place}
                        onChange={(e) => setExtendData({ ...extendData, prolongation_place: e.target.value })}
                        className="rounded-xl h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 font-semibold text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAYMENT REGISTRATION PANEL - NEW PAYMENT SECTION AS REQUESTED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-amber-50/20 p-6 rounded-2xl border border-amber-100">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-600" /> 3. Nouveau Paiement (Facultatif)
                  </h3>
                  <p className="text-slate-500 text-xs">Saisissez un paiement si le client règle tout ou partie de l'extension de contrat immédiatement.</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="new_payment" className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">Montant versé (DT)</Label>
                        <Button 
                          type="button" 
                          variant="link" 
                          size="sm" 
                          onClick={() => {
                            const extendPrice = calculateExtendPrice();
                            const alreadyPaid = parseFloat(selectedExtendRental.amount_paid || "0");
                            const remainingToPay = Math.max(0, extendPrice.total - alreadyPaid);
                            setExtendData({ ...extendData, new_payment: remainingToPay.toFixed(3) });
                          }}
                          className="text-xs font-black text-amber-700 hover:text-amber-950 p-0 h-auto"
                        >
                          ✓ Tout payer
                        </Button>
                      </div>
                      <Input 
                        id="new_payment"
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="0.000"
                        value={extendData.new_payment}
                        onChange={(e) => setExtendData({ ...extendData, new_payment: e.target.value })}
                        className="rounded-xl h-12 bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-500 font-extrabold text-base text-green-700 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_payment_mode" className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">Mode de paiement d'extension</Label>
                      <Select 
                        value={extendData.new_payment_mode} 
                        onValueChange={(v) => setExtendData({ ...extendData, new_payment_mode: v })}
                      >
                        <SelectTrigger 
                          className="h-12 bg-white border-slate-200 rounded-xl focus:ring-amber-500 font-semibold shadow-sm"
                          showClear={!!extendData.new_payment_mode}
                          onClear={() => setExtendData({ ...extendData, new_payment_mode: "" })}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl shadow-xl">
                          <SelectItem value="Espèces">Espèces</SelectItem>
                          <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                          <SelectItem value="Chèque">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                {selectedExtendRental && extendData.end_date && (
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 space-y-4">
                    <h4 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">Aperçu financier mis à jour</h4>
                    <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                      <span className="text-slate-600">Tarif du véhicule :</span>
                      <span className="text-right font-bold text-slate-800">{selectedExtendRental.daily_price || 0} DT / jour</span>

                      <span className="text-slate-600">Nombre total de jours :</span>
                      <span className="text-right font-bold text-slate-800">{calculateExtendPrice().days} jours</span>

                      <span className="text-slate-600 border-t border-slate-200 pt-2">Initial total contrat :</span>
                      <span className="text-right font-bold text-slate-700 border-t border-slate-200 pt-2">{parseFloat(selectedExtendRental.total_price || 0).toFixed(3)} DT</span>

                      <span className="text-amber-950 font-bold">Nouveau total contrat :</span>
                      <span className="text-right font-black text-amber-950 text-base">{calculateExtendPrice().total.toFixed(3)} DT</span>

                      <span className="text-slate-600 border-t border-dashed border-slate-300 pt-1">Déjà versé au contrat :</span>
                      <span className="text-right font-bold text-slate-700 pt-1">{parseFloat(selectedExtendRental.amount_paid || "0").toFixed(3)} DT</span>

                      {parseFloat(extendData.new_payment || "0") > 0 && (
                        <>
                          <span className="text-emerald-700 font-bold">Nouveau versement saisi :</span>
                          <span className="text-right font-extrabold text-emerald-700">+{parseFloat(extendData.new_payment || "0").toFixed(3)} DT</span>
                        </>
                      )}

                      <span className="text-slate-700 font-extrabold border-t border-slate-300 pt-2 text-sm">Total versé (Cumulé) :</span>
                      <span className="text-right font-black text-slate-900 border-t border-slate-300 pt-2 text-sm">
                        {(parseFloat(selectedExtendRental.amount_paid || "0") + parseFloat(extendData.new_payment || "0")).toFixed(3)} DT
                      </span>

                      <span className="text-red-700 font-extrabold text-sm">Reste à payer final :</span>
                      <span className="text-right font-black text-red-700 text-lg">
                        {Math.max(0, calculateExtendPrice().total - (parseFloat(selectedExtendRental.amount_paid || "0") + parseFloat(extendData.new_payment || "0"))).toFixed(3)} DT
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t flex justify-between items-center bg-slate-50 p-6 rounded-2xl">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsExtendOpen(false)} 
                  className="h-12 px-8 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-100 transition-all shadow-sm"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-12 font-black uppercase tracking-wider shadow-lg shadow-amber-200 transition-all hover:scale-[1.02]"
                >
                  Prolonger & Télécharger contrat
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
