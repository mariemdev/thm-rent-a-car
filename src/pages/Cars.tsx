import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Car as CarIcon, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  MapPin,
  History,
  Shield,
  FileCheck,
  FileText,
  Droplets,
  Settings2,
  Camera,
  Eye,
  X,
  Save,
  Maximize2
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { TablePagination } from "@/components/TablePagination";

export default function Cars() {
  const { t } = useTranslation();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRepairHistoryOpen, setIsRepairHistoryOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [editingCar, setEditingCar] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [regFilter, setRegFilter] = useState<string>("");
  const [branches, setBranches] = useState<any[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [colorsList, setColorsList] = useState<any[]>([]);
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [isAddingNewColor, setIsAddingNewColor] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [isDeleteRepairConfirmOpen, setIsDeleteRepairConfirmOpen] = useState(false);
  const [repairToDelete, setRepairToDelete] = useState<number | null>(null);
  const [repairFilterDateStart, setRepairFilterDateStart] = useState("");
  const [repairFilterDateEnd, setRepairFilterDateEnd] = useState("");
  const [repairCurrentPage, setRepairCurrentPage] = useState(1);
  const repairsPerPage = 5;
  const [repairDateFilter, setRepairDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Advanced vehicle filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availFilter, setAvailFilter] = useState<string>("all");
  const [availStartDate, setAvailStartDate] = useState<string>("");
  const [availEndDate, setAvailEndDate] = useState<string>("");
  const [fuelFilter, setFuelFilter] = useState<string>("all");
  const [transmissionFilter, setTransmissionFilter] = useState<string>("all");
  const [soldFilter, setSoldFilter] = useState<string>("all");


  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initialCarState = {
    brand: "",
    model: "",
    registration: "",
    mileage: "",
    insurance_start_date: "",
    insurance_expiry_date: "",
    technical_inspection_start_date: "",
    technical_inspection_expiry_date: "",
    last_oil_change_mileage: 0,
    next_oil_change_mileage: 0,
    circulation_date: "",
    vignette_start_date: "",
    vignette_expiry_date: "",
    exploitation_start_date: "",
    exploitation_end_date: "",
    fuel_type: "Essence",
    transmission: "Manuelle",
    year: new Date().getFullYear(),
    fuel_total_bars: "8",
    fuel_current_bars: 8,
    power: "",
    color: "",
    seats: "5",
    category: "Tourisme",
    parking_location: "",
    chassis_number: "",
    abs: false,
    alarm: false,
    fog_lights: false,
    ac: false,
    power_steering: false,
    is_sold: false,
    sale_date: "",
    status: "available",
    images: [],
    agency_id: "",
    branch_id: "",
    reg_part1: "",
    reg_partTU: "TU",
    reg_part2: ""
  };

  const [newCar, setNewCar] = useState<any>(initialCarState);

  const [rentals, setRentals] = useState<any[]>([]);
  const [selectedCarForCalendar, setSelectedCarForCalendar] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [repairs, setRepairs] = useState<any[]>([]);

  const FuelBarsSelector = ({ value, total, onChange, label }: { value: number, total: number, onChange: (v: number) => void, label?: string }) => {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
        <div className="flex items-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className={cn(
                "h-8 flex-1 rounded-sm transition-all border",
                i < value 
                  ? "bg-orange-500 border-orange-600 shadow-inner" 
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200"
              )}
              title={`${i + 1} / ${total} barres`}
            />
          ))}
          <span className="ml-2 text-xs font-bold text-slate-500">{value}/{total}</span>
        </div>
      </div>
    );
  };

  const [isAddRepairOpen, setIsAddRepairOpen] = useState(false);
  const [isEditRepairOpen, setIsEditRepairOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<any>(null);
  const [newRepair, setNewRepair] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    mileage: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, r, b, brands, colors] = await Promise.all([
        api.getCars(), 
        api.getRentals(), 
        api.getBranches(),
        api.getBrands(),
        api.getColors()
      ]);
      setCars(c);
      setRentals(r);
      setBranches(b);
      setBrandsList(brands);
      setColorsList(colors);
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewBrand = async () => {
    if (!newBrandName.trim()) return;
    try {
      const brand = await api.createBrand({ name: newBrandName.trim() });
      setBrandsList(prev => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)));
      if (isAddOpen) setNewCar({...newCar, brand: brand.name});
      if (isEditOpen) setEditingCar({...editingCar, brand: brand.name});
      setIsAddingNewBrand(false);
      setNewBrandName("");
      toast.success("Nouvelle marque ajoutée");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddNewColor = async () => {
    if (!newColorName.trim()) return;
    try {
      const color = await api.createColor({ name: newColorName.trim() });
      setColorsList(prev => [...prev, color].sort((a, b) => a.name.localeCompare(b.name)));
      if (isAddOpen) setNewCar({...newCar, color: color.name});
      if (isEditOpen) setEditingCar({...editingCar, color: color.name});
      setIsAddingNewColor(false);
      setNewColorName("");
      toast.success("Nouvelle couleur ajoutée");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchRepairs = async (carId: number) => {
    try {
      const data = await api.getRepairs(carId);
      setRepairs(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des réparations");
    }
  };

  const handleAddRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCar) return;
    try {
      await api.createRepair(editingCar.id, newRepair);
      toast.success("Réparation ajoutée");
      setIsAddRepairOpen(false);
      setNewRepair({
        date: new Date().toISOString().split('T')[0],
        description: "",
        amount: "",
        mileage: ""
      });
      fetchRepairs(editingCar.id);
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleEditRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepair || !editingCar) return;
    try {
      await api.updateRepair(editingRepair.id, editingRepair);
      toast.success("Réparation modifiée avec succès");
      setIsEditRepairOpen(false);
      setEditingRepair(null);
      fetchRepairs(editingCar.id);
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteRepair = async () => {
    if (repairToDelete === null) return;
    try {
      console.log(`Attempting to delete repair ID: ${repairToDelete}`);
      await api.deleteRepair(repairToDelete);
      toast.success("Réparation supprimée avec succès");
      
      // Refresh list using the car ID currently being edited/viewed in the history dialog
      if (editingCar?.id) {
        fetchRepairs(editingCar.id);
      }
      
      setIsDeleteRepairConfirmOpen(false);
      setRepairToDelete(null);
    } catch (error: any) {
      console.error("Error deleting repair:", error);
      toast.error(`Erreur lors de la suppression: ${error.message || "Erreur inconnue"}`);
    }
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    
    if (!validateCarData(newCar)) return;

    setSaving(true);
    try {
      const registration = `${newCar.reg_part1} ${newCar.reg_partTU} ${newCar.reg_part2}`;
      const carData = { 
        ...newCar, 
        registration,
        fuel_type: newCar.fuel_type || "Essence",
        mileage: parseInt(newCar.mileage || "0"),
        seats: parseInt(newCar.seats || "5"),
        agency_id: (user.role === 'admin' || user.role === 'superadmin') ? (newCar.agency_id || user.agency_id) : user.agency_id,
        images: Array.isArray(newCar.images) ? JSON.stringify(newCar.images) : newCar.images
      };
      console.log('Creating car with images:', carData.images?.length || 0, 'images');
      await api.createCar(carData);
      toast.success(t("common.success"));
      setIsAddOpen(false);
      fetchData();
      setNewCar(initialCarState);
    } catch (error: any) {
      console.error('Error creating car:', error);
      toast.error(error.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const validateCarData = (car: any) => {
    const missing = [];
    
    // General - Essentials only
    if (!car.brand) missing.push("Marque");
    if (!car.model) missing.push("Modèle");
    if (!car.reg_part1 || !car.reg_part2) missing.push("Immatriculation");
    if (!car.branch_id) missing.push("Local");
    
    if (missing.length > 0) {
      toast.error(
        <div className="space-y-2">
          <p className="font-bold">Champs obligatoires manquants :</p>
          <ul className="list-disc pl-4 text-sm">
            {missing.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>,
        { duration: 5000 }
      );
      return false;
    }

    // Numerical validation
    if (car.mileage !== undefined && car.mileage !== "" && (isNaN(Number(car.mileage)) || Number(car.mileage) < 0)) {
      toast.error("Le kilométrage doit être un nombre positif.");
      return false;
    }

    if (car.seats !== undefined && car.seats !== "" && (isNaN(Number(car.seats)) || Number(car.seats) <= 0)) {
      toast.error("Le nombre de places doit être supérieur à 0.");
      return false;
    }

    if (car.year !== undefined && car.year !== "" && (isNaN(Number(car.year)) || Number(car.year) < 1900 || Number(car.year) > 2100)) {
      toast.error("L'année doit être un nombre valide entre 1900 et 2100.");
      return false;
    }

    // Registration plates numeric checks for Tunisia
    if (car.reg_part1 && !/^\d+$/.test(car.reg_part1.toString())) {
      toast.error("La première partie de l'immatriculation (gauche) doit contenir uniquement des chiffres.");
      return false;
    }
    if (car.reg_part2 && !/^\d+$/.test(car.reg_part2.toString())) {
      toast.error("La deuxième partie de l'immatriculation (droite) doit contenir uniquement des chiffres.");
      return false;
    }

    // Date logical validation
    if (car.insurance_start_date && car.insurance_expiry_date && new Date(car.insurance_expiry_date) <= new Date(car.insurance_start_date)) {
      toast.error("La date d'échéance de l'assurance doit être postérieure à la date d'effet.");
      return false;
    }

    if (car.technical_inspection_start_date && car.technical_inspection_expiry_date && new Date(car.technical_inspection_expiry_date) <= new Date(car.technical_inspection_start_date)) {
      toast.error("La date d'échéance de la visite technique doit être postérieure à la date d'effet.");
      return false;
    }

    if (car.vignette_start_date && car.vignette_expiry_date && new Date(car.vignette_expiry_date) <= new Date(car.vignette_start_date)) {
      toast.error("La date d'échéance de la vignette doit être postérieure à la date d'effet.");
      return false;
    }

    return true;
  };

  const handleUpdateCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!validateCarData(editingCar)) return;

    setSaving(true);
    try {
      const registration = editingCar.reg_part1 ? `${editingCar.reg_part1} ${editingCar.reg_partTU} ${editingCar.reg_part2}` : editingCar.registration;
      const carData = {
        ...editingCar,
        registration,
        mileage: parseInt(editingCar.mileage || "0"),
        seats: parseInt(editingCar.seats || "5"),
        images: Array.isArray(editingCar.images) ? JSON.stringify(editingCar.images) : editingCar.images
      };
      console.log('Updating car with images:', carData.images?.length || 0, 'images');
      await api.updateCar(editingCar.id, carData);
      toast.success(t("common.success"));
      setIsEditOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating car:', error);
      toast.error(error.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCar = async () => {
    if (!selectedCar) return;
    const hasRentals = rentals.some(r => r.car_id === selectedCar.id);
    if (hasRentals) {
      toast.error("Impossible de supprimer ce véhicule car il est associé à des locations déjà affectées.");
      return;
    }
    try {
      await api.deleteCar(selectedCar.id);
      toast.success(t("common.success"));
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    }
  };

  const getCarStatus = (car: any) => {
    if (car.is_sold === 1 || car.is_sold === true || car.is_sold === "1") return 'sold';
    if (car.status === 'archived') return 'archived';
    if (car.status === 'maintenance') return 'maintenance';
    
    const today = new Date().toISOString().split('T')[0];
    const activeRental = rentals.find(r => 
      r.car_id === car.id && 
      r.status !== 'cancelled' && 
      today >= r.start_date && 
      today <= r.end_date
    );
    
    return activeRental ? 'rented' : 'available';
  };

  const uniqueCategories = Array.from(new Set(["Tourisme", "Fourgonnette", "SUV", "Utilitaire", ...cars.map(c => c.category).filter(Boolean)])).sort();
  const uniqueFuelTypes = Array.from(new Set(["Essence", "Diesel", "Hybride", "Électrique", ...cars.map(c => c.fuel_type).filter(Boolean)])).sort();
  const uniqueTransmissions = Array.from(new Set(["Manuelle", "Automatique", ...cars.map(c => c.transmission).filter(Boolean)])).sort();

  const resetFilters = () => {
    setSearch("");
    setBrandFilter("");
    setModelFilter("");
    setRegFilter("");
    setCategoryFilter("all");
    setLocationFilter("all");
    setFuelFilter("all");
    setTransmissionFilter("all");
    setSoldFilter("all");
    setAvailFilter("all");
    setAvailStartDate("");
    setAvailEndDate("");
    setStatusFilter("active");
  };

  const filteredCars = cars
    .filter(c => {
      const isCarSold = c.is_sold === 1 || c.is_sold === true || c.is_sold === "1";
      
      const matchesSearch = 
        c.brand.toLowerCase().includes(search.toLowerCase()) || 
        c.model.toLowerCase().includes(search.toLowerCase()) ||
        c.registration.toLowerCase().includes(search.toLowerCase()) ||
        (c.category && c.category.toLowerCase().includes(search.toLowerCase()));
      
      const status = getCarStatus(c);
      
      // Top Level Tab Status Filters
      if (statusFilter === "archived") {
        if (c.status !== "archived") return false;
      } else if (statusFilter === "active") {
        if (c.status === "archived") return false;
      } else if (statusFilter === "available") {
        if (c.status === "archived" || isCarSold || status !== "available") return false;
      } else if (statusFilter === "sold") {
        if (c.status === "archived" || !isCarSold) return false;
      } else {
        // "all" fallback: still hide archived by default
        if (c.status === "archived") return false;
      }

      // Filter: display only the list of vehicles sold, or only non-sold, or all
      let matchesSold = true;
      if (soldFilter === "sold") {
        matchesSold = isCarSold;
      } else if (soldFilter === "not_sold") {
        matchesSold = !isCarSold;
      }

      const matchesLocation = locationFilter === "all" || c.branch_id?.toString() === locationFilter;
      const matchesBrand = !brandFilter || c.brand.toLowerCase().includes(brandFilter.toLowerCase());
      const matchesModel = !modelFilter || c.model.toLowerCase().includes(modelFilter.toLowerCase());
      const matchesReg = !regFilter || c.registration.toLowerCase().includes(regFilter.toLowerCase());
      const matchesCategory = categoryFilter === "all" || c.category?.toLowerCase() === categoryFilter.toLowerCase();
      const matchesFuel = fuelFilter === "all" || c.fuel_type?.toLowerCase() === fuelFilter.toLowerCase();
      const matchesTransmission = transmissionFilter === "all" || c.transmission?.toLowerCase() === transmissionFilter.toLowerCase();

      // Filter by availability (current or par période)
      let matchesAvailability = true;
      if (availFilter === "current") {
        matchesAvailability = (status === "available" && !isCarSold && c.status !== "archived" && c.status !== "maintenance");
      } else if (availFilter === "period") {
        if (availStartDate && availEndDate) {
          const overlaps = rentals.some(r => 
            r.car_id === c.id && 
            r.status !== 'cancelled' && 
            !(r.end_date < availStartDate || r.start_date > availEndDate)
          );
          matchesAvailability = !overlaps && !isCarSold && c.status !== "archived" && c.status !== "maintenance";
        }
      }

      return matchesSearch && matchesLocation && matchesBrand && matchesModel && matchesReg && matchesSold && matchesCategory && matchesFuel && matchesTransmission && matchesAvailability;
    })
    .sort((a, b) => b.id - a.id);

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 rounded-full flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> {t("cars.available")}</Badge>;
      case 'rented':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 rounded-full flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {t("cars.rented")}</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 rounded-full flex items-center gap-1.5"><Wrench className="w-3 h-3" /> {t("cars.maintenance")}</Badge>;
      case 'sold':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-3 py-1 rounded-full flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Vendu</Badge>;
      case 'archived':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-3 py-1 rounded-full flex items-center gap-1.5"><X className="w-3 h-3" /> Archivé</Badge>;
      default:
        return null;
    }
  };

  const handleArchiveCar = async (carId: number) => {
    try {
      await api.updateCar(carId, { status: 'archived' });
      toast.success("Véhicule archivé avec succès");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    }
  };

  const handleUnarchiveCar = async (carId: number) => {
    try {
      await api.updateCar(carId, { status: 'available' });
      toast.success("Véhicule restauré avec succès");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Dialog open={isAddingNewBrand} onOpenChange={setIsAddingNewBrand}>
        <DialogContent className="sm:max-w-[400px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle marque</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Nom de la marque</Label>
            <Input 
              value={newBrandName} 
              onChange={e => setNewBrandName(e.target.value)} 
              className="mt-2" 
              placeholder="Ex: Mercedes-Benz, BMW..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingNewBrand(false)}>Annuler</Button>
            <Button onClick={handleAddNewBrand} className="bg-blue-600 hover:bg-blue-700">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingNewColor} onOpenChange={setIsAddingNewColor}>
        <DialogContent className="sm:max-w-[400px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle couleur</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Nom de la couleur</Label>
            <Input 
              value={newColorName} 
              onChange={e => setNewColorName(e.target.value)} 
              className="mt-2" 
              placeholder="Ex: Rouge Cerise, Bleu Marine..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingNewColor(false)}>Annuler</Button>
            <Button onClick={handleAddNewColor} className="bg-blue-600 hover:bg-blue-700">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("cars.title")}</h1>
          <p className="text-slate-500 mt-1">Gérez votre flotte de véhicules THM RENT A CAR.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            className={cn(buttonVariants({ variant: "default" }), "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-lg h-11 px-6")}
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("cars.add")}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] rounded-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{t("cars.add")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCar} className="space-y-4 py-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4 bg-slate-100 p-1 rounded-lg">
                  <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Général</TabsTrigger>
                  <TabsTrigger value="technical" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Technique</TabsTrigger>
                  <TabsTrigger value="maintenance" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Maintenance</TabsTrigger>
                  <TabsTrigger value="images" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Images</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t("cars.brand")} <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <Select value={newCar.brand || ""} onValueChange={v => {
                          if (v === "add_new") {
                            setIsAddingNewBrand(true);
                          } else {
                            setNewCar({...newCar, brand: v});
                          }
                        }}>
                          <SelectTrigger 
                            className="rounded-md border-slate-200 flex-1"
                            showClear={!!newCar.brand}
                            onClear={() => setNewCar({...newCar, brand: "", model: ""})}
                          >
                            <SelectValue placeholder={t("cars.chooseBrand")} />
                          </SelectTrigger>
                          <SelectContent>
                            {brandsList.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                            <SelectItem value="add_new" className="text-blue-600 font-bold border-t mt-1">+ Nouvelle Marque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t("cars.model")} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Input 
                          value={newCar.model || ""} 
                          onChange={e => setNewCar({...newCar, model: e.target.value})} 
                          required 
                          className="rounded-md border-slate-200"
                          placeholder="Modèle ou saisie libre"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t("cars.registration")} <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="123" 
                        value={newCar.reg_part1 || ""} 
                        onChange={e => setNewCar({...newCar, reg_part1: e.target.value.replace(/[^\d]/g, '')})}
                        required
                        className="w-24 text-center font-bold"
                      />
                      <span className="font-bold text-slate-400">TU</span>
                      <Input 
                        placeholder="4567" 
                        value={newCar.reg_part2 || ""} 
                        onChange={e => setNewCar({...newCar, reg_part2: e.target.value.replace(/[^\d]/g, '')})}
                        required
                        className="flex-1 text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Catégorie</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {["Tourisme", "Prestige", "Autre"].map(cat => {
                            const isSelected = cat === "Autre"
                              ? !["Tourisme", "Prestige"].includes(newCar.category)
                              : newCar.category === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  if (cat === "Autre") {
                                    setNewCar({...newCar, category: ""});
                                  } else {
                                    setNewCar({...newCar, category: cat});
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer flex-1 text-center",
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                        {!["Tourisme", "Prestige"].includes(newCar.category) && (
                          <Input
                            placeholder="Saisir la catégorie"
                            value={newCar.category || ""}
                            onChange={e => setNewCar({...newCar, category: e.target.value})}
                            className="rounded-md h-9 text-xs border-slate-200"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Couleur</label>
                      <Select value={newCar.color || ""} onValueChange={v => {
                        if (v === "add_new") {
                          setIsAddingNewColor(true);
                        } else {
                          setNewCar({...newCar, color: v});
                        }
                      }}>
                        <SelectTrigger 
                          className="rounded-md border-slate-200"
                          showClear={!!newCar.color}
                          onClear={() => setNewCar({...newCar, color: ""})}
                        >
                          <SelectValue placeholder="Choisir une couleur" />
                        </SelectTrigger>
                        <SelectContent>
                          {colorsList.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                          <SelectItem value="add_new" className="text-blue-600 font-bold border-t mt-1">+ Nouvelle Couleur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t("cars.location")} <span className="text-red-500">*</span></label>
                      <Select value={newCar.branch_id || ""} onValueChange={v => setNewCar({...newCar, branch_id: v})} required>
                        <SelectTrigger 
                          className="rounded-md border-slate-200"
                          showClear={!!newCar.branch_id}
                          onClear={() => setNewCar({...newCar, branch_id: ""})}
                        >
                          <SelectValue placeholder="Lieu de stationnement">
                            {newCar.branch_id && branches.find(b => b.id.toString() === newCar.branch_id.toString())?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Année</label>
                      <Input type="number" value={newCar.year || ""} onChange={e => setNewCar({...newCar, year: e.target.value})} className="rounded-md border-slate-200" placeholder="Ex: 2023" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Nombre de places</label>
                      <Input type="number" value={newCar.seats || "5"} onChange={e => setNewCar({...newCar, seats: e.target.value})} className="rounded-md border-slate-200" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Boîte de vitesse</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {["Manuelle", "Automatique", "Autre"].map(t => {
                            const isSelected = t === "Autre"
                              ? (newCar.transmission !== "Manuelle" && newCar.transmission !== "Automatique")
                              : newCar.transmission === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  if (t === "Autre") {
                                    setNewCar({...newCar, transmission: ""});
                                  } else {
                                    setNewCar({...newCar, transmission: t});
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer flex-1 text-center",
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                        {(newCar.transmission !== "Manuelle" && newCar.transmission !== "Automatique") && (
                          <Input
                            placeholder="Saisir la boîte de vitesse"
                            value={newCar.transmission || ""}
                            onChange={e => setNewCar({...newCar, transmission: e.target.value})}
                            className="rounded-md h-9 text-xs border-slate-200"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Puissance (CV)</label>
                      <Input value={newCar.power || ""} onChange={e => setNewCar({...newCar, power: e.target.value})} className="rounded-md border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">N° Châssis</label>
                    <Input value={newCar.chassis_number || ""} onChange={e => setNewCar({...newCar, chassis_number: e.target.value})} className="rounded-md border-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Carburant</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {["Essence", "Gasoil", "GPL", "Hybride", "Électrique", "Autre"].map(f => {
                          const isSelected = f === "Autre"
                            ? !["Essence", "Gasoil", "GPL", "Hybride", "Électrique"].includes(newCar.fuel_type)
                            : newCar.fuel_type === f;
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => {
                                  if (f === "Autre") {
                                    setNewCar({...newCar, fuel_type: ""});
                                  } else {
                                    setNewCar({...newCar, fuel_type: f});
                                  }
                              }}
                              className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer flex-1 text-center whitespace-nowrap",
                                isSelected
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>
                      {!["Essence", "Gasoil", "GPL", "Hybride", "Électrique"].includes(newCar.fuel_type) && (
                        <Input
                          placeholder="Saisir le type de carburant"
                          value={newCar.fuel_type || ""}
                          onChange={e => setNewCar({...newCar, fuel_type: e.target.value})}
                          className="rounded-md h-9 text-xs border-slate-200"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nombre de barres (Carburant)</label>
                    <Input 
                      type="number" 
                      value={newCar.fuel_total_bars || "8"} 
                      onChange={e => {
                        const total = e.target.value;
                        setNewCar({
                          ...newCar, 
                          fuel_total_bars: total, 
                          fuel_current_bars: parseInt(total) || 0
                        });
                      }} 
                      className="rounded-md border-slate-200" 
                      placeholder="Ex: 8"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Options</label>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                      {[
                        { id: 'abs', label: 'ABS' },
                        { id: 'alarm', label: 'Alarme' },
                        { id: 'fog_lights', label: 'Anti-brouillard' },
                        { id: 'ac', label: 'Climatisée' },
                        { id: 'power_steering', label: 'Direction assistée' }
                      ].map(opt => (
                        <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newCar[opt.id]}
                            onChange={e => setNewCar({...newCar, [opt.id]: e.target.checked})}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-semibold text-slate-700">Date de mise en circulation</label>
                      <Input type="date" value={newCar.circulation_date || ""} onChange={e => setNewCar({...newCar, circulation_date: e.target.value})} className="rounded-md border-slate-200" />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Date d'exploitation</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Date de début</label>
                        <Input type="date" value={newCar.exploitation_start_date || ""} onChange={e => setNewCar({...newCar, exploitation_start_date: e.target.value})} className="rounded-md border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Date de fin</label>
                        <Input type="date" value={newCar.exploitation_end_date || ""} onChange={e => setNewCar({...newCar, exploitation_end_date: e.target.value})} className="rounded-md border-slate-200" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 p-3 border rounded-lg bg-orange-50 border-orange-100">
                    <input 
                      type="checkbox" 
                      id="is_sold"
                      checked={newCar.is_sold}
                      onChange={e => setNewCar({...newCar, is_sold: e.target.checked})}
                    />
                    <label htmlFor="is_sold" className="text-sm font-semibold text-orange-800">Véhicule vendu ?</label>
                    {newCar.is_sold && (
                      <Input 
                        type="date" 
                        value={newCar.sale_date || ""} 
                        onChange={e => setNewCar({...newCar, sale_date: e.target.value})}
                        className="ml-auto w-40 h-8"
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase">Assurance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date début</Label>
                        <Input type="date" value={newCar.insurance_start_date || ""} onChange={e => setNewCar({...newCar, insurance_start_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date fin</Label>
                        <Input type="date" value={newCar.insurance_expiry_date || ""} onChange={e => setNewCar({...newCar, insurance_expiry_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-3">
                    <h4 className="text-xs font-bold text-amber-700 uppercase">Visite Technique</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date début</Label>
                        <Input type="date" value={newCar.technical_inspection_start_date || ""} onChange={e => setNewCar({...newCar, technical_inspection_start_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date fin</Label>
                        <Input type="date" value={newCar.technical_inspection_expiry_date || ""} onChange={e => setNewCar({...newCar, technical_inspection_expiry_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-3">
                    <h4 className="text-xs font-bold text-purple-700 uppercase">Vignette</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date début</Label>
                        <Input type="date" value={newCar.vignette_start_date || ""} onChange={e => setNewCar({...newCar, vignette_start_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date fin</Label>
                        <Input type="date" value={newCar.vignette_expiry_date || ""} onChange={e => setNewCar({...newCar, vignette_expiry_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-3">
                    <h4 className="text-xs font-bold text-red-700 uppercase">Vidange</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Dernière (km)</Label>
                        <Input type="number" value={newCar.last_oil_change_mileage || 0} onChange={e => setNewCar({...newCar, last_oil_change_mileage: parseInt(e.target.value) || 0})} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Prochaine (km)</Label>
                        <Input type="number" value={newCar.next_oil_change_mileage || 0} onChange={e => setNewCar({...newCar, next_oil_change_mileage: parseInt(e.target.value) || 0})} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Photos du véhicule</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {newCar.images?.map((img: string, idx: number) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                          <img src={img} alt="Car" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => {
                              const newImages = [...newCar.images];
                              newImages.splice(idx, 1);
                              setNewCar({...newCar, images: newImages});
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-video rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                        <Camera className="w-6 h-6 text-slate-300" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewCar({
                                  ...newCar,
                                  images: [...(newCar.images || []), reader.result]
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter className="pt-4 flex justify-between items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setNewCar(initialCarState)} className="rounded-md text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700">Réinitialiser</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-md">{t("common.cancel")}</Button>
                  <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 rounded-md px-8">
                    {saving ? "Enregistrement..." : t("common.save")}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex-wrap h-auto gap-1">
            <TabsTrigger value="active" className="rounded-xl px-4 sm:px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-600 transition-all font-bold">
              Véhicules Actifs
            </TabsTrigger>
            <TabsTrigger value="available" className="rounded-xl px-4 sm:px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-emerald-600 transition-all font-bold">
              Véhicules Disponibles
            </TabsTrigger>
            <TabsTrigger value="sold" className="rounded-xl px-4 sm:px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-orange-600 transition-all font-bold">
              Véhicules Vendus
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-xl px-4 sm:px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-slate-600 transition-all font-bold">
              Véhicules Archivés
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="border border-slate-150 shadow-md overflow-hidden rounded-2xl bg-white">
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex flex-1 w-full flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Rechercher par marque, modèle, immatriculation, catégorie..." 
                    value={search || ""}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 h-11 bg-slate-50/70 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all w-full text-slate-800 placeholder-slate-450"
                  />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={cn(
                      "h-11 px-4 rounded-xl border font-semibold flex items-center gap-2 transition-all shadow-sm",
                      showAdvancedFilters
                        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    {showAdvancedFilters ? "Fermer les filtres" : "Filtres avancés"}
                  </Button>
                  
                  {(search || brandFilter || modelFilter || regFilter || categoryFilter !== "all" || locationFilter !== "all" || fuelFilter !== "all" || transmissionFilter !== "all" || soldFilter !== "all" || availFilter !== "all" || statusFilter !== "all") && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetFilters}
                      className="h-11 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-medium"
                      title="Réinitialiser tous les filtres"
                    >
                      <X className="w-4 h-4 mr-1.5" /> Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-slate-100 bg-slate-50/40"
              >
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {/* Row 1: Brand, Model, Reg */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Marque</Label>
                    <Select value={brandFilter || "all"} onValueChange={(val) => setBrandFilter(val === "all" ? "" : val)}>
                      <SelectTrigger 
                        className="h-10 bg-white border-slate-200 rounded-xl"
                        showClear={brandFilter !== "all" && brandFilter !== ""}
                        onClear={() => setBrandFilter("")}
                      >
                        <SelectValue placeholder="Toutes les marques" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Toutes les marques</SelectItem>
                        {Array.from(new Set([...brandsList.map(b => b.name), ...cars.map(c => c.brand)].filter(Boolean))).sort().map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Modèle</Label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Ex: 208, Rio..."
                        value={modelFilter}
                        onChange={(e) => setModelFilter(e.target.value)}
                        className="h-10 pl-9 bg-white border-slate-200 rounded-xl"
                        list="car-models-list"
                      />
                      <datalist id="car-models-list">
                        {Array.from(new Set(cars.map(c => c.model).filter(Boolean))).sort().map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Immatriculation (Matricule)</Label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Ex: 208 TU..."
                        value={regFilter}
                        onChange={(e) => setRegFilter(e.target.value)}
                        className="h-10 pl-9 bg-white border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Local de disponibilité</Label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger 
                        className="h-10 bg-white border-slate-200 rounded-xl"
                        showClear={locationFilter !== "all" && locationFilter !== ""}
                        onClear={() => setLocationFilter("all")}
                      >
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <SelectValue placeholder="Tous les locaux" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tous les locaux</SelectItem>
                        {branches.map(b => {
                          const formattedName = b.name.toLowerCase().includes("local") ? b.name : `Local ${b.name}`;
                          return (
                            <SelectItem key={b.id} value={b.id.toString()}>
                              {formattedName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 2: Category (Pills) & Availability */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catégorie</Label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: "Toutes", value: "all" },
                        { label: "Tourisme", value: "Tourisme" },
                        { label: "Prestige", value: "Prestige" }
                      ].map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategoryFilter(cat.value)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap",
                            categoryFilter === cat.value
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disponibilité</Label>
                    <Select value={availFilter} onValueChange={avail => setAvailFilter(avail)}>
                      <SelectTrigger 
                        className="h-10 bg-white border-slate-200 rounded-xl"
                        showClear={availFilter !== "all" && availFilter !== ""}
                        onClear={() => setAvailFilter("all")}
                      >
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Toutes les disponibilités</SelectItem>
                        <SelectItem value="current">Disponible immédiatement</SelectItem>
                        <SelectItem value="period">Filtrer par période spécifique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {availFilter === "period" && (
                    <div className="flex gap-2 sm:col-span-1 animate-in slide-in-from-top duration-200">
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Début</Label>
                        <Input
                          type="date"
                          value={availStartDate}
                          onChange={(e) => setAvailStartDate(e.target.value)}
                          className="h-10 bg-white border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fin</Label>
                        <Input
                          type="date"
                          value={availEndDate}
                          onChange={(e) => setAvailEndDate(e.target.value)}
                          className="h-10 bg-white border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Row 3: Fuel (Pills) & Transmission (Pills) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type de carburant</Label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["all", "Essence", "Gasoil", "GPL", "Hybride", "Électrique"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFuelFilter(f)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap",
                            fuelFilter === f
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {f === "all" ? "Tous" : f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Boîte de vitesse</Label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["all", "Manuelle", "Automatique"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTransmissionFilter(t)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap",
                            transmissionFilter === t
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {t === "all" ? "Toutes" : t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-9 px-4 rounded-xl text-slate-600 hover:text-slate-800"
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(false)}
                    className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    Appliquer les filtres
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[100px] font-bold text-slate-500 uppercase text-[10px] tracking-wider">{t("cars.images")}</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">{t("cars.brand")} & {t("cars.model")}</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">{t("cars.registration")}</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">{t("cars.location")}</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">{t("cars.status")}</TableHead>
                <TableHead className="text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">{t("cars.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-48 text-center">Chargement...</TableCell></TableRow>
              ) : filteredCars.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-500">No cars found.</TableCell></TableRow>
              ) : filteredCars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((car) => (
                <TableRow key={car.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell>
                    <div className="w-16 h-12 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                      {(() => {
                        let imageUrl = null;
                        try {
                          const images = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
                          if (Array.isArray(images) && images.length > 0) {
                            imageUrl = images[0];
                          } else if (typeof images === 'string') {
                            imageUrl = images; // Single string case
                          }
                        } catch (e) {
                          // Fail silently, use default icon
                        }
                        return imageUrl ? (
                          <img src={imageUrl} alt="Car" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <CarIcon className="w-6 h-6 text-slate-300" />
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">{car.brand}</div>
                    <div className="text-xs text-slate-500">{car.model}</div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-slate-50 px-2 py-1 rounded text-xs font-mono font-bold text-blue-700 border border-blue-100">
                      {car.registration}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      {car.branch_name || "Non assigné"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={getCarStatus(car)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-sm">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-all"
                          onClick={() => {
                            setSelectedCar(car);
                            setIsDetailsOpen(true);
                          }}
                          title="Fiche Technique"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-white rounded-lg transition-all"
                          onClick={() => {
                            const regParts = car.registration ? car.registration.split(' ') : ['', 'TU', ''];
                            // Parse images from JSON string if needed
                            const parsedImages = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
                            setEditingCar({
                              ...car,
                              reg_part1: regParts[0] || "",
                              reg_partTU: regParts[1] || "TU",
                              reg_part2: regParts[2] || "",
                              images: Array.isArray(parsedImages) ? parsedImages : []
                            });
                            setIsEditOpen(true);
                          }}
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-all"
                          onClick={() => {
                            setSelectedCarForCalendar(car);
                            setIsCalendarOpen(true);
                          }}
                          title="Planning"
                        >
                          <CalendarIcon className="w-4 h-4" />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-white rounded-lg transition-all"
                          onClick={() => {
                            setEditingCar(car);
                            setIsRepairHistoryOpen(true);
                            fetchRepairs(car.id);
                          }}
                          title="Entretien & Réparations"
                        >
                          <Wrench className="w-4 h-4" />
                        </Button>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all")}>
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-sm">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase px-3 py-2 letter-spacing-wider">Actions Secondaires</DropdownMenuLabel>
                            
                            <DropdownMenuItem 
                              onClick={() => car.status === 'archived' ? handleUnarchiveCar(car.id) : handleArchiveCar(car.id)}
                              className="rounded-xl flex items-center gap-3 p-3 cursor-pointer group transition-all"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                car.status === 'archived' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                              )}>
                                {car.status === 'archived' ? <History className="w-4 h-4" /> : <X className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">
                                  {car.status === 'archived' ? "Restaurer" : "Archiver"}
                                </span>
                                <span className="text-[10px] opacity-70">
                                  {car.status === 'archived' ? "Remettre en service" : "Masquer du parc actif"}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>

                          <DropdownMenuSeparator className="my-2 bg-slate-50" />
                          
                          <DropdownMenuGroup>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedCar(car);
                                setIsDeleteOpen(true);
                              }}
                              className="rounded-xl flex items-center gap-3 p-3 cursor-pointer group focus:bg-red-50 focus:text-red-700 transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-focus:bg-white transition-all">
                                <Trash2 className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">Supprimer</span>
                                <span className="text-[10px] opacity-70">Action irréversible</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredCars.length / itemsPerPage)}
          itemsPerPage={itemsPerPage}
          totalItems={filteredCars.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </Card>
      </Tabs>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Détails du véhicule: {selectedCar?.brand} {selectedCar?.model}
              </DialogTitle>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Gallery with Scrollbar */}
              <div className="space-y-4">
                <div 
                  className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer group relative shadow-inner"
                  onClick={() => {
                    if (selectedCar?.images?.[0]) {
                      setSelectedImage(selectedCar.images[0]);
                      setIsImageViewerOpen(true);
                    }
                  }}
                >
                  {(() => {
                    let images = [];
                    try {
                      images = typeof selectedCar?.images === 'string' ? JSON.parse(selectedCar.images) : selectedCar?.images;
                    } catch(e) {}
                    
                    return Array.isArray(images) && images.length > 0 ? (
                      <>
                        <img src={images[0]} alt="Car" className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="text-white w-8 h-8" />
                        </div>
                      </>
                    ) : (
                      <CarIcon className="w-16 h-16 text-slate-200" />
                    );
                  })()}
                </div>
                
                {/* Thumbnails Scroll Area */}
                <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  {(() => {
                    let images = [];
                    try {
                      images = typeof selectedCar?.images === 'string' ? JSON.parse(selectedCar.images) : selectedCar?.images;
                    } catch(e) {}
                    
                    return Array.isArray(images) && images.map((img: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-blue-500 transition-all shadow-sm"
                        onClick={() => {
                          setSelectedImage(img);
                          setIsImageViewerOpen(true);
                        }}
                      >
                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Main Info */}
              <div className="grid grid-cols-2 gap-4 h-fit">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Immatriculation</Label>
                  <div className="text-base font-mono font-bold text-blue-700">{selectedCar?.registration}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kilométrage</Label>
                  <div className="text-base font-bold text-slate-900">{selectedCar?.mileage} km</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carburant</Label>
                  <div className="text-base font-bold text-slate-900">{selectedCar?.fuel_type}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Puissance</Label>
                  <div className="text-base font-bold text-slate-900">{selectedCar?.power} CV</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Couleur</Label>
                  <div className="text-base font-bold text-slate-900">{selectedCar?.color || '-'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Boîte</Label>
                  <div className="text-base font-bold text-slate-900">{selectedCar?.transmission || '-'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Année</Label>
                  <div className="text-base font-bold text-slate-900">{selectedCar?.year || '-'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Places</Label>
                  <div className="text-base font-bold text-slate-900">{selectedCar?.seats}</div>
                </div>
              </div>
            </div>

            {/* Technical & Administrative Tabs */}
            <Tabs defaultValue="dates" className="w-full">
              <TabsList className="bg-slate-100 p-1 rounded-xl mb-4">
                <TabsTrigger value="dates" className="rounded-lg">Calendrier & Dates</TabsTrigger>
                <TabsTrigger value="technical" className="rounded-lg">Technique & Options</TabsTrigger>
                <TabsTrigger value="planning" className="rounded-lg">Planning</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dates" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <Label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Mise en circulation</Label>
                    <div className="font-bold text-slate-900 mt-1">{selectedCar?.circulation_date ? format(new Date(selectedCar.circulation_date), 'dd/MM/yyyy') : '-'}</div>
                  </div>
                  <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <Label className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Assurance Expire le</Label>
                    <div className="font-bold text-slate-900 mt-1">{selectedCar?.insurance_expiry_date ? format(new Date(selectedCar.insurance_expiry_date), 'dd/MM/yyyy') : '-'}</div>
                  </div>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <Label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Visite Tech. Expire le</Label>
                    <div className="font-bold text-slate-900 mt-1">{selectedCar?.technical_inspection_expiry_date ? format(new Date(selectedCar.technical_inspection_expiry_date), 'dd/MM/yyyy') : '-'}</div>
                  </div>
                  <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <Label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Vignette Expire le</Label>
                    <div className="font-bold text-slate-900 mt-1">{selectedCar?.vignette_expiry_date ? format(new Date(selectedCar.vignette_expiry_date), 'dd/MM/yyyy') : '-'}</div>
                  </div>
                  <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                    <Label className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Prochaine Vidanges</Label>
                    <div className="font-bold text-slate-900 mt-1">{selectedCar?.next_oil_change_mileage || '-'} km</div>
                  </div>
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <Label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Début d'exploitation</Label>
                    <div className="font-bold text-slate-900 mt-1">{selectedCar?.exploitation_start_date ? format(new Date(selectedCar.exploitation_start_date), 'dd/MM/yyyy') : '-'}</div>
                  </div>
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <Label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Fin d'exploitation</Label>
                    <div className="font-bold text-slate-900 mt-1">{selectedCar?.exploitation_end_date ? format(new Date(selectedCar.exploitation_end_date), 'dd/MM/yyyy') : '-'}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest px-1">Infrastructure</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase mb-1">Catégorie</Label>
                        <span className="text-xs font-bold text-slate-700">{selectedCar?.category}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase mb-1">Localisation</Label>
                        <span className="text-xs font-bold text-slate-700">{branches.find(b => b.id === selectedCar?.branch_id)?.name || 'N/A'}</span>
                      </div>
                      <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase mb-1">N° Châssis</Label>
                        <div className="text-xs font-mono font-bold text-slate-700 break-all">{selectedCar?.chassis_number || 'Non renseigné'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest px-1">Options Équipement</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'abs', label: 'Freinage ABS' },
                        { id: 'alarm', label: 'Système d\'alarme' },
                        { id: 'fog_lights', label: 'Projecteurs antibrouillard' },
                        { id: 'ac', label: 'Climatisation' },
                        { id: 'power_steering', label: 'Direction assistée' }
                      ].map(opt => (
                        <div key={opt.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-xs font-medium text-slate-600">{opt.label}</span>
                          {selectedCar?.[opt.id] ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="planning" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Locations programmées</h4>
                  <div className="space-y-3">
                    {rentals.filter(r => r.car_id === selectedCar?.id && r.status !== 'cancelled').length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 italic">Aucune location future pour ce véhicule.</p>
                      </div>
                    ) : (
                      rentals
                        .filter(r => r.car_id === selectedCar?.id && r.status !== 'cancelled')
                        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                        .map(r => (
                          <div key={r.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{r.customer_name}</div>
                                <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <CalendarIcon className="w-3 h-3" />
                                  Du {format(new Date(r.start_date), 'dd/MM/yyyy')} au {format(new Date(r.end_date), 'dd/MM/yyyy')}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-blue-50 text-blue-700 border-none px-3 py-1 rounded-full text-[10px] font-bold">
                                {new Date(r.start_date) > new Date() ? 'À VENIR' : 'EN COURS'}
                              </Badge>
                              <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                {r.total_amount} DT
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button 
                onClick={() => {
                    const regParts = selectedCar.registration ? selectedCar.registration.split(' ') : ['', 'TU', ''];
                    // Parse images from JSON string if needed
                    const parsedImages = typeof selectedCar.images === 'string' ? JSON.parse(selectedCar.images) : selectedCar.images;
                    setEditingCar({
                      ...selectedCar,
                      reg_part1: regParts[0] || "",
                      reg_partTU: regParts[1] || "TU",
                      reg_part2: regParts[2] || "",
                      images: Array.isArray(parsedImages) ? parsedImages : []
                    });
                    setIsDetailsOpen(false);
                    setIsEditOpen(true);
                }} 
                className="rounded-xl px-8 bg-blue-600 text-white hover:bg-blue-700 mr-auto"
            >
                Modifier
            </Button>
            <Button onClick={() => setIsDetailsOpen(false)} className="rounded-xl px-8 bg-slate-900 text-white hover:bg-slate-800">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedCarForCalendar?.brand} {selectedCarForCalendar?.model} - Disponibilité
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Locations programmées</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {rentals.filter(r => r.car_id === selectedCarForCalendar?.id && r.status !== 'cancelled').length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Aucune location future pour ce véhicule.</p>
                ) : (
                  rentals
                    .filter(r => r.car_id === selectedCarForCalendar?.id && r.status !== 'cancelled')
                    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                    .map(r => (
                      <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{r.customer_name}</div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(r.start_date), 'dd/MM/yyyy')} - {format(new Date(r.end_date), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-none text-[10px]">RÉSERVÉ</Badge>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCalendarOpen(false)} className="rounded-md">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-lg max-h-[90vh] overflow-y-auto font-sans">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Modifier le véhicule</DialogTitle>
          </DialogHeader>
          {editingCar && (
            <form onSubmit={handleUpdateCar} className="space-y-4 py-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4 bg-slate-100 p-1 rounded-lg">
                  <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Général</TabsTrigger>
                  <TabsTrigger value="technical" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Technique</TabsTrigger>
                  <TabsTrigger value="maintenance" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Maintenance</TabsTrigger>
                  <TabsTrigger value="images" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Images</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t("cars.brand")} <span className="text-red-500">*</span></label>
                      <Select value={editingCar.brand || ""} onValueChange={v => {
                        if (v === "add_new") {
                          setIsAddingNewBrand(true);
                        } else {
                          setEditingCar({...editingCar, brand: v});
                        }
                      }}>
                        <SelectTrigger 
                          className="rounded-md border-slate-200"
                          showClear={!!editingCar.brand}
                          onClear={() => setEditingCar({...editingCar, brand: "", model: ""})}
                        >
                          <SelectValue placeholder={t("cars.chooseBrand")} />
                        </SelectTrigger>
                        <SelectContent>
                          {brandsList.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                          <SelectItem value="add_new" className="text-blue-600 font-bold border-t mt-1">+ Nouvelle Marque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t("cars.model")} <span className="text-red-500">*</span></label>
                      <Input value={editingCar.model || ""} onChange={e => setEditingCar({...editingCar, model: e.target.value})} required className="rounded-md border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t("cars.registration")} <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="123" 
                        value={editingCar.reg_part1 || ""} 
                        onChange={e => setEditingCar({...editingCar, reg_part1: e.target.value.replace(/[^\d]/g, '')})}
                        required
                        className="w-24 text-center font-bold"
                      />
                      <span className="font-bold text-slate-400">TU</span>
                      <Input 
                        placeholder="4567" 
                        value={editingCar.reg_part2 || ""} 
                        onChange={e => setEditingCar({...editingCar, reg_part2: e.target.value.replace(/[^\d]/g, '')})}
                        required
                        className="flex-1 text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Catégorie</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {["Tourisme", "Prestige", "Autre"].map(cat => {
                            const isSelected = cat === "Autre"
                              ? !["Tourisme", "Prestige"].includes(editingCar.category)
                              : editingCar.category === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  if (cat === "Autre") {
                                    setEditingCar({...editingCar, category: ""});
                                  } else {
                                    setEditingCar({...editingCar, category: cat});
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer flex-1 text-center",
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                        {!["Tourisme", "Prestige"].includes(editingCar.category) && (
                          <Input
                            placeholder="Saisir la catégorie"
                            value={editingCar.category || ""}
                            onChange={e => setEditingCar({...editingCar, category: e.target.value})}
                            className="rounded-md h-9 text-xs border-slate-200"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Couleur</label>
                      <Select value={editingCar.color || ""} onValueChange={v => {
                        if (v === "add_new") {
                          setIsAddingNewColor(true);
                        } else {
                          setEditingCar({...editingCar, color: v});
                        }
                      }}>
                        <SelectTrigger 
                          className="rounded-md border-slate-200"
                          showClear={!!editingCar.color}
                          onClear={() => setEditingCar({...editingCar, color: ""})}
                        >
                          <SelectValue placeholder="Choisir une couleur" />
                        </SelectTrigger>
                        <SelectContent>
                          {colorsList.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                          <SelectItem value="add_new" className="text-blue-600 font-bold border-t mt-1">+ Nouvelle Couleur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t("cars.location")}</label>
                      <Select value={editingCar.branch_id?.toString() || ""} onValueChange={v => setEditingCar({...editingCar, branch_id: v})}>
                        <SelectTrigger 
                          className="rounded-md border-slate-200"
                          showClear={!!editingCar.branch_id}
                          onClear={() => setEditingCar({...editingCar, branch_id: ""})}
                        >
                          <SelectValue placeholder="Lieu de stationnement">
                            {editingCar.branch_id && branches.find(b => b.id.toString() === editingCar.branch_id.toString())?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Année</label>
                      <Input type="number" value={editingCar.year || ""} onChange={e => setEditingCar({...editingCar, year: e.target.value})} className="rounded-md border-slate-200" placeholder="Ex: 2023" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Nombre de places <span className="text-red-500">*</span></label>
                      <Input type="number" value={editingCar.seats || "5"} onChange={e => setEditingCar({...editingCar, seats: e.target.value})} required className="rounded-md border-slate-200" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Boîte de vitesse</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {["Manuelle", "Automatique", "Autre"].map(t => {
                            const isSelected = t === "Autre"
                              ? (editingCar.transmission !== "Manuelle" && editingCar.transmission !== "Automatique")
                              : editingCar.transmission === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  if (t === "Autre") {
                                    setEditingCar({...editingCar, transmission: ""});
                                  } else {
                                    setEditingCar({...editingCar, transmission: t});
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer flex-1 text-center",
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                        {(editingCar.transmission !== "Manuelle" && editingCar.transmission !== "Automatique") && (
                          <Input
                            placeholder="Saisir la boîte de vitesse"
                            value={editingCar.transmission || ""}
                            onChange={e => setEditingCar({...editingCar, transmission: e.target.value})}
                            className="rounded-md h-9 text-xs border-slate-200"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Puissance (CV)</label>
                      <Input value={editingCar.power || ""} onChange={e => setEditingCar({...editingCar, power: e.target.value})} className="rounded-md border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">N° Châssis</label>
                    <Input value={editingCar.chassis_number || ""} onChange={e => setEditingCar({...editingCar, chassis_number: e.target.value})} className="rounded-md border-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Carburant</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {["Essence", "Gasoil", "GPL", "Hybride", "Électrique", "Autre"].map(f => {
                          const isSelected = f === "Autre"
                            ? !["Essence", "Gasoil", "GPL", "Hybride", "Électrique"].includes(editingCar.fuel_type)
                            : editingCar.fuel_type === f;
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => {
                                  if (f === "Autre") {
                                    setEditingCar({...editingCar, fuel_type: ""});
                                  } else {
                                    setEditingCar({...editingCar, fuel_type: f});
                                  }
                              }}
                              className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer flex-1 text-center whitespace-nowrap",
                                isSelected
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>
                      {!["Essence", "Gasoil", "GPL", "Hybride", "Électrique"].includes(editingCar.fuel_type) && (
                        <Input
                          placeholder="Saisir le type de carburant"
                          value={editingCar.fuel_type || ""}
                          onChange={e => setEditingCar({...editingCar, fuel_type: e.target.value})}
                          className="rounded-md h-9 text-xs border-slate-200"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Nombre de barres (Carburant)</label>
                      <Input 
                        type="number" 
                        value={editingCar.fuel_total_bars || "8"} 
                        onChange={e => {
                          const total = e.target.value;
                          setEditingCar({
                            ...editingCar, 
                            fuel_total_bars: total, 
                            fuel_current_bars: Math.min(editingCar.fuel_current_bars || 0, parseInt(total) || 0)
                          });
                        }} 
                        className="rounded-md border-slate-200" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Options</label>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                      {[
                        { id: 'abs', label: 'ABS' },
                        { id: 'alarm', label: 'Alarme' },
                        { id: 'fog_lights', label: 'Anti-brouillard' },
                        { id: 'ac', label: 'Climatisée' },
                        { id: 'power_steering', label: 'Direction assistée' }
                      ].map(opt => (
                        <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={editingCar[opt.id]}
                            onChange={e => setEditingCar({...editingCar, [opt.id]: e.target.checked})}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-semibold text-slate-700">Date de mise en circulation</label>
                      <Input type="date" value={editingCar.circulation_date || ""} onChange={e => setEditingCar({...editingCar, circulation_date: e.target.value})} className="rounded-md border-slate-200" />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Date d'exploitation</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Date de début</label>
                        <Input type="date" value={editingCar.exploitation_start_date || ""} onChange={e => setEditingCar({...editingCar, exploitation_start_date: e.target.value})} className="rounded-md border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Date de fin</label>
                        <Input type="date" value={editingCar.exploitation_end_date || ""} onChange={e => setEditingCar({...editingCar, exploitation_end_date: e.target.value})} className="rounded-md border-slate-200" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 p-3 border rounded-lg bg-orange-50 border-orange-100">
                    <input 
                      type="checkbox" 
                      id="edit_is_sold"
                      checked={editingCar.is_sold}
                      onChange={e => setEditingCar({...editingCar, is_sold: e.target.checked})}
                    />
                    <label htmlFor="edit_is_sold" className="text-sm font-semibold text-orange-800">Véhicule vendu ?</label>
                    {editingCar.is_sold && (
                      <Input 
                        type="date" 
                        value={editingCar.sale_date || ""} 
                        onChange={e => setEditingCar({...editingCar, sale_date: e.target.value})}
                        className="ml-auto w-40 h-8"
                      />
                    )}
                  </div>

                </TabsContent>

                <TabsContent value="maintenance" className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase">Assurance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date début</Label>
                        <Input type="date" value={editingCar.insurance_start_date || ""} onChange={e => setEditingCar({...editingCar, insurance_start_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date fin</Label>
                        <Input type="date" value={editingCar.insurance_expiry_date || ""} onChange={e => setEditingCar({...editingCar, insurance_expiry_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-3">
                    <h4 className="text-xs font-bold text-amber-700 uppercase">Visite Technique</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date début</Label>
                        <Input type="date" value={editingCar.technical_inspection_start_date || ""} onChange={e => setEditingCar({...editingCar, technical_inspection_start_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date fin</Label>
                        <Input type="date" value={editingCar.technical_inspection_expiry_date || ""} onChange={e => setEditingCar({...editingCar, technical_inspection_expiry_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-3">
                    <h4 className="text-xs font-bold text-purple-700 uppercase">Vignette</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date début</Label>
                        <Input type="date" value={editingCar.vignette_start_date || ""} onChange={e => setEditingCar({...editingCar, vignette_start_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Date fin</Label>
                        <Input type="date" value={editingCar.vignette_expiry_date || ""} onChange={e => setEditingCar({...editingCar, vignette_expiry_date: e.target.value})} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-3">
                    <h4 className="text-xs font-bold text-red-700 uppercase">Vidange</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Dernière (km)</Label>
                        <Input type="number" value={editingCar.last_oil_change_mileage || 0} onChange={e => setEditingCar({...editingCar, last_oil_change_mileage: parseInt(e.target.value) || 0})} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Prochaine (km)</Label>
                        <Input type="number" value={editingCar.next_oil_change_mileage || 0} onChange={e => setEditingCar({...editingCar, next_oil_change_mileage: parseInt(e.target.value) || 0})} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Photos du véhicule</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Array.isArray(editingCar.images) ? editingCar.images : []).map((img: string, idx: number) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                          <img src={img} alt="Car" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => {
                              const newImages = [...(Array.isArray(editingCar.images) ? editingCar.images : [])];
                              newImages.splice(idx, 1);
                              setEditingCar({...editingCar, images: newImages});
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-video rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                        <Camera className="w-6 h-6 text-slate-300" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingCar({
                                  ...editingCar,
                                  images: [...(editingCar.images || []), reader.result]
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter className="pt-4 flex justify-between items-center sm:justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    const original = cars.find(c => c.id === editingCar.id);
                    if (original) setEditingCar({...original});
                  }} 
                  className="rounded-md text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  Réinitialiser
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-md">{t("common.cancel")}</Button>
                  <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 rounded-md px-8">
                    {saving ? "Enregistrement..." : t("common.save")}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRepairHistoryOpen} onOpenChange={setIsRepairHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Historique des réparations: {editingCar?.brand} {editingCar?.model}
              </DialogTitle>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => setIsRepairHistoryOpen(false)} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Depuis</Label>
                  <Input type="date" value={repairFilterDateStart} onChange={e => { setRepairFilterDateStart(e.target.value); setRepairCurrentPage(1); }} className="h-10 text-sm w-36" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Jusqu'à</Label>
                  <Input type="date" value={repairFilterDateEnd} onChange={e => { setRepairFilterDateEnd(e.target.value); setRepairCurrentPage(1); }} className="h-10 text-sm w-36" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setRepairFilterDateStart(""); setRepairFilterDateEnd(""); }} className="h-10">Réinitialiser</Button>
              </div>
              <Button 
                onClick={() => setIsAddRepairOpen(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-4"
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter une réparation
              </Button>
            </div>

            <div className="border rounded-2xl overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Description</TableHead>
                    <TableHead className="font-bold">Kilométrage</TableHead>
                    <TableHead className="font-bold">Montant</TableHead>
                    <TableHead className="font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filteredRepairs = repairs.filter(r => {
                      if (!repairFilterDateStart && !repairFilterDateEnd) return true;
                      const date = new Date(r.date);
                      if (repairFilterDateStart && date < new Date(repairFilterDateStart)) return false;
                      if (repairFilterDateEnd && date > new Date(repairFilterDateEnd)) return false;
                      return true;
                    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);
                    const paginatedRepairs = filteredRepairs.slice((repairCurrentPage - 1) * repairsPerPage, repairCurrentPage * repairsPerPage);
                    
                    return (
                      <>
                        {paginatedRepairs.map((repair) => (
                          <TableRow key={repair.id}>
                            <TableCell className="text-sm">{format(new Date(repair.date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-sm font-medium">{repair.description}</TableCell>
                            <TableCell className="text-sm">{repair.mileage} km</TableCell>
                            <TableCell className="text-sm font-bold text-orange-600">{repair.amount} DT</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    setEditingRepair(repair);
                                    setIsEditRepairOpen(true);
                                  }} 
                                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                >
                                  <Edit2 size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    setRepairToDelete(repair.id);
                                    setIsDeleteRepairConfirmOpen(true);
                                  }} 
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredRepairs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic">Aucune réparation trouvée</TableCell>
                          </TableRow>
                        )}
                        {filteredRepairs.length > repairsPerPage && (
                          <TableRow>
                            <TableCell colSpan={5} className="p-2 bg-slate-50/50">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Page {repairCurrentPage} sur {Math.ceil(filteredRepairs.length / repairsPerPage)}</span>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => setRepairCurrentPage(p => Math.max(1, p - 1))} disabled={repairCurrentPage === 1}>Préc.</Button>
                                  <Button variant="ghost" size="sm" onClick={() => setRepairCurrentPage(p => Math.min(Math.ceil(filteredRepairs.length / repairsPerPage), p + 1))} disabled={repairCurrentPage === Math.ceil(filteredRepairs.length / repairsPerPage)}>Suiv.</Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button onClick={() => setIsRepairHistoryOpen(false)} className="rounded-xl px-8 bg-slate-900 text-white hover:bg-slate-800">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddRepairOpen} onOpenChange={setIsAddRepairOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Ajouter une réparation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRepair} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Date</Label>
              <Input type="date" value={newRepair.date} onChange={e => setNewRepair({...newRepair, date: e.target.value})} className="rounded-xl h-11 border-slate-200" required />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Description</Label>
              <Textarea placeholder="Filtre à huile, plaquettes..." value={newRepair.description} onChange={e => setNewRepair({...newRepair, description: e.target.value})} className="rounded-xl border-slate-200" required />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Montant (DT)</Label>
              <Input type="number" placeholder="0.000" value={newRepair.amount ?? ""} onChange={e => setNewRepair({...newRepair, amount: e.target.value})} className="rounded-xl h-11 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Kilométrage</Label>
              <Input type="number" placeholder="Km au moment de la réparation" value={newRepair.mileage ?? ""} onChange={e => setNewRepair({...newRepair, mileage: e.target.value})} className="rounded-xl h-11 border-slate-200" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddRepairOpen(false)} className="rounded-xl">Annuler</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRepairOpen} onOpenChange={setIsEditRepairOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Modifier la réparation</DialogTitle>
          </DialogHeader>
          {editingRepair && (
            <form onSubmit={handleEditRepair} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Date</Label>
                <Input 
                  type="date" 
                  value={editingRepair.date ? editingRepair.date.split('T')[0] : ""} 
                  onChange={e => setEditingRepair({...editingRepair, date: e.target.value})} 
                  className="rounded-xl h-11 border-slate-200" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Description</Label>
                <Textarea 
                  placeholder="Filtre à huile, plaquettes..." 
                  value={editingRepair.description || ""} 
                  onChange={e => setEditingRepair({...editingRepair, description: e.target.value})} 
                  className="rounded-xl border-slate-200" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Montant (DT)</Label>
                <Input 
                  type="number" 
                  placeholder="0.000" 
                  value={editingRepair.amount ?? ""} 
                  onChange={e => setEditingRepair({...editingRepair, amount: e.target.value})} 
                  className="rounded-xl h-11 border-slate-200" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Kilométrage</Label>
                <Input 
                  type="number" 
                  placeholder="Km au moment de la réparation" 
                  value={editingRepair.mileage ?? ""} 
                  onChange={e => setEditingRepair({...editingRepair, mileage: e.target.value})} 
                  className="rounded-xl h-11 border-slate-200" 
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditRepairOpen(false)} className="rounded-xl">Annuler</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8">Modifier</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteCar}
        title="Supprimer la voiture"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedCar?.brand} ${selectedCar?.model} (${selectedCar?.registration}) ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />

      <ConfirmDialog
        open={isDeleteRepairConfirmOpen}
        onOpenChange={setIsDeleteRepairConfirmOpen}
        onConfirm={handleDeleteRepair}
        title="Supprimer la réparation"
        description="Êtes-vous sûr de vouloir supprimer cette intervention de l'historique ?"
        confirmText="Supprimer"
      />

      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsImageViewerOpen(false)} 
              className="absolute top-4 right-4 z-50 bg-black/50 text-white hover:bg-black/70 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Full size" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => <Wrench className={className} />;
