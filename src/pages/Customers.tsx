import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  CreditCard,
  ChevronRight,
  MoreHorizontal,
  ArrowLeft,
  Save,
  X
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { TablePagination } from "@/components/TablePagination";

interface Customer {
  id: number;
  type: 'individual' | 'company';
  name: string;
  first_name?: string;
  birth_date?: string;
  birth_place?: string;
  nationality?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone: string;
  email?: string;
  observation?: string;
  id_type?: string;
  id_number?: string;
  id_issued_date?: string;
  id_issued_place?: string;
  id_expiry_date?: string;
  license_number?: string;
  license_issued_date?: string;
  license_issued_place?: string;
  license_expiry_date?: string;
  country?: string;
}

export default function Customers() {
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [listType, setListType] = useState<'all' | 'individual' | 'company'>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    type: 'individual',
    nationality: 'تونسية',
    city: 'تونس',
    country: 'تونس'
  });
  const [isCustomNationality, setIsCustomNationality] = useState(false);
  const [customNationality, setCustomNationality] = useState("");
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // For custom cascade delete dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [associatedRentalsForDelete, setAssociatedRentalsForDelete] = useState<any[]>([]);
  const [checkingDelete, setCheckingDelete] = useState(false);

  const nationalities = [
    "فرنسية", "تونسية", "جزائرية", "مغربية", "ليبية", 
    "إيطالية", "إسبانية", "ألمانية", "بلجيكية", "سويسرية", 
    "كندية", "أمريكية", "بريطانية", "سنغالية", "إيفوارية", "مالية"
  ].sort((a, b) => a.localeCompare(b, 'ar'));

  const cities = [
    "تونس", "أريانة", "بن عروس", "منوبة", "بنزرت", "باجة", "جندوبة", "الكاف", 
    "سليانة", "القيروان", "القصرين", "سيدي بوزيد", "سوسة", "المنستير", "المهدية", 
    "صفاقس", "قفصة", "توزر", "قبلي", "قابس", "مدنين", "تطاوين", "زغوان", "نابل"
  ].sort((a, b) => a.localeCompare(b, 'ar'));

  const countries = [
    "تونس", "ليبيا", "الجزائر", "المغرب", "مصر", "فرنسا", "إيطاليا", "ألمانيا", 
    "إسبانيا", "بلجيكا", "سويسرا", "كندا", "الولايات المتحدة", "المملكة المتحدة", 
    "المملكة العربية السعودية", "الإمارات العربية المتحدة", "العراق"
  ].sort((a, b) => a.localeCompare(b, 'ar'));

  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [customCountry, setCustomCountry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Essentials only
      if (!formData.name || !formData.phone) {
        toast.error("Le nom et le téléphone sont obligatoires");
        return;
      }

      if (!formData.city) {
        toast.error("La ville est obligatoire");
        return;
      }

      // Phone number format validation
      const cleanPhone = (formData.phone || "").replace(/[^\d]/g, '');
      if (cleanPhone.length < 8) {
        toast.error("Le numéro de téléphone doit contenir au moins 8 chiffres.");
        return;
      }

      // Email validation if entered
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("L'adresse email saisie est invalide.");
        return;
      }

      const isIndividual = formData.type === 'individual';
      if (isIndividual) {
        if (!formData.first_name) {
          toast.error("Le prénom est obligatoire");
          return;
        }

        // Birth date validation
        if (!formData.birth_date) {
          toast.error("La date de naissance est obligatoire");
          return;
        } else {
          const birth = new Date(formData.birth_date);
          if (birth > new Date()) {
            toast.error("La date de naissance ne peut pas être dans le futur.");
            return;
          }
          const ageDiff = Date.now() - birth.getTime();
          const ageDate = new Date(ageDiff);
          const age = Math.abs(ageDate.getUTCFullYear() - 1970);
          if (age < 18) {
            toast.error("Le client doit avoir au moins 18 ans.");
            return;
          }
        }

        if (!formData.birth_place) {
          toast.error("Le lieu de naissance est obligatoire");
          return;
        }
        if (!formData.nationality) {
          toast.error("La nationalité est obligatoire");
          return;
        }
        if (!formData.id_type) {
          toast.error("Le type de pièce d'identité est obligatoire");
          return;
        }
        if (!formData.id_number) {
          toast.error("Le numéro de la pièce d'identité est obligatoire");
          return;
        }

        // CIN Validation
        if (formData.id_type === "CIN" && !/^\d{8}$/.test(formData.id_number)) {
          toast.error("Le numéro CIN doit être composé de 8 chiffres.");
          return;
        }

        if (!formData.id_issued_date) {
          toast.error("La date de délivrance de la pièce d'identité est obligatoire");
          return;
        }
        if (!formData.id_issued_place) {
          toast.error("Le lieu de délivrance de la pièce d'identité est obligatoire");
          return;
        }

        // Id Dates logical validation
        if (formData.id_issued_date && formData.id_expiry_date && new Date(formData.id_expiry_date) <= new Date(formData.id_issued_date)) {
          toast.error("La date d'expiration de la pièce d'identité doit être postérieure à sa date de délivrance.");
          return;
        }
        
        // Let's also enforce driving license
        if (!formData.license_number) {
          toast.error("Le numéro du permis de conduire est obligatoire");
          return;
        }
        if (!formData.license_issued_date) {
          toast.error("La date de délivrance du permis est obligatoire");
          return;
        }
        if (!formData.license_issued_place) {
          toast.error("Le lieu de délivrance du permis est obligatoire");
          return;
        }

        // License Dates logical validation
        if (formData.license_issued_date && formData.license_expiry_date && new Date(formData.license_expiry_date) <= new Date(formData.license_issued_date)) {
          toast.error("La date d'expiration du permis de conduire doit être postérieure à sa date de délivrance.");
          return;
        }
      }

      const dataToSave = { ...formData };

      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, dataToSave);
        toast.success("Client mis à jour");
      } else {
        await api.createCustomer(dataToSave);
        toast.success("Client créé");
      }
      setIsAddOpen(false);
      setIsEditOpen(false);
      setEditingCustomer(null);
      setFormData({ 
        type: 'individual',
        nationality: 'تونسية',
        city: 'تونس',
        country: 'تونس'
      });
      fetchCustomers();
    } catch (error: any) {
      console.error("Save error:", error);
      let errorMessage = "Erreur lors de l'enregistrement";
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    try {
      setCheckingDelete(true);
      const allRentals = await api.getRentals();
      const associated = allRentals.filter((r: any) => 
        r.customer_id === customer.id || 
        r.driver_id === customer.id ||
        r.second_driver_id === customer.id ||
        (customer.id_number && r.customer_id_number === customer.id_number && r.customer_name === customer.name)
      );

      // Check if they have active or scheduled bookings
      if (associated.length > 0) {
        // Block deletion completely if there is at least one associated rental
        setCustomerToDelete(customer);
        setAssociatedRentalsForDelete(associated);
        setDeleteBlockedOpen(true);
      } else {
        // Allow deletion with custom confirmation Dialog
        setCustomerToDelete(customer);
        setAssociatedRentalsForDelete([]);
        setDeleteConfirmOpen(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la vérification des données du client.");
    } finally {
      setCheckingDelete(false);
    }
  };

  const confirmDeleteCascade = async () => {
    if (!customerToDelete) return;
    try {
      setCheckingDelete(true);
      await api.deleteCustomer(customerToDelete.id, true);
      toast.success("Le client et l'ensemble de ses contrats de location ont été supprimés.");
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      setAssociatedRentalsForDelete([]);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression.");
    } finally {
      setCheckingDelete(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.id_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    
    const matchesType = listType === 'all' || customer.type === listType;
    
    return matchesSearch && matchesType;
  }).sort((a, b) => (b.id || 0) - (a.id || 0));

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handleOpenHistory = async (customer: Customer) => {
    try {
      setLoading(true);
      const allRentals = await api.getRentals();
      const history = allRentals.filter((r: any) => 
        r.customer_id === customer.id || 
        (r.customer_id_number === customer.id_number && r.customer_name === customer.name)
      );
      setCustomerHistory(history);
      setEditingCustomer(customer);
      setIsHistoryOpen(true);
    } catch (error) {
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer: Customer | null = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
      const isCustom = customer.nationality ? !nationalities.includes(customer.nationality) : false;
      setIsCustomNationality(isCustom);
      setCustomNationality(isCustom ? customer.nationality : "");

      const isCustomCt = customer.city ? !cities.includes(customer.city) : false;
      setIsCustomCity(isCustomCt);
      setCustomCity(isCustomCt ? customer.city : "");

      const isCustomCo = customer.country ? !countries.includes(customer.country) : false;
      setIsCustomCountry(isCustomCo);
      setCustomCountry(isCustomCo ? customer.country : "");
    } else {
      setEditingCustomer(null);
      setFormData({ 
        type: 'individual',
        nationality: 'تونسية',
        city: 'تونس',
        country: 'تونس'
      });
      setIsCustomNationality(false);
      setCustomNationality("");
      setIsCustomCity(false);
      setCustomCity("");
      setIsCustomCountry(false);
      setCustomCountry("");
    }
    setIsAddOpen(customer === null);
    setIsEditOpen(customer !== null);
  };

  if (isAddOpen || isEditOpen) {
    return (
      <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsAddOpen(false);
              setIsEditOpen(false);
              setEditingCustomer(null);
            }} 
            className="rounded-full h-10 w-10 p-0 hover:bg-slate-100 text-slate-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isEditOpen ? "Modifier le Client" : "Nouveau Client"}
            </h1>
            <p className="text-slate-500 mt-1">
              {isEditOpen ? `Mise à jour des informations de ${editingCustomer?.name || ""} ${editingCustomer?.first_name || ""}` : "Remplissez les informations pour créer un nouveau client."}
            </p>
          </div>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden max-w-4xl mx-auto">
          <div className="p-8 space-y-10">
            {/* Type Selection */}
            <div className="flex flex-col gap-4">
              <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Type de Client</Label>
              <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit">
                <Button 
                  variant={formData.type === 'individual' ? 'default' : 'ghost'}
                  onClick={() => setFormData({...formData, type: 'individual'})}
                  className={`rounded-xl px-8 h-12 transition-all ${formData.type === 'individual' ? 'bg-white text-indigo-600 shadow-sm hover:bg-white' : 'text-slate-600'}`}
                >
                  <User className="w-5 h-5 mr-2" /> Particulier
                </Button>
                <Button 
                  type="button"
                  variant={formData.type === 'company' ? 'default' : 'ghost'}
                  onClick={() => setFormData({...formData, type: 'company', id_type: 'Registre de Commerce'})}
                  className={`rounded-xl px-8 h-12 transition-all ${formData.type === 'company' ? 'bg-white text-amber-600 shadow-sm hover:bg-white' : 'text-slate-600'}`}
                >
                  <Building2 className="w-5 h-5 mr-2" /> Entreprise
                </Button>
              </div>
            </div>

            {/* General Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Information Générale</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {formData.type === 'individual' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">{t('customers.firstName')} <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder={t('customers.firstName')}
                      value={formData.first_name || ""}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">{formData.type === 'company' ? (i18n.language === 'ar' ? "الاسم التجاري / الشركة" : "Raison Sociale") : t('customers.name')} <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder={formData.type === 'company' ? (i18n.language === 'ar' ? "اسم الشركة" : "Nom de l'entreprise") : (i18n.language === 'ar' ? "اللقب" : "Nom de famille")}
                    value={formData.name || ""}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Téléphone <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="+216 -- --- ---"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/[^\d\s+\-()]/g, '')})}
                    className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Email {formData.type === 'company' && <span className="text-red-500">*</span>}</Label>
                  <Input 
                    type="email"
                    placeholder="exemple@mail.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                  />
                </div>
                {formData.type === 'individual' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Date de naissance <span className="text-red-500">*</span></Label>
                      <Input 
                        type="date"
                        value={formData.birth_date || ""}
                        onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                        className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Lieu de naissance <span className="text-red-500">*</span></Label>
                      <Input 
                        placeholder="Ville, Pays"
                        value={formData.birth_place || ""}
                        onChange={(e) => setFormData({...formData, birth_place: e.target.value})}
                        className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Nationalité <span className="text-red-500">*</span></Label>
                      {!isCustomNationality ? (
                        <Select 
                          value={nationalities.includes(formData.nationality || "") ? formData.nationality : (formData.nationality ? "other" : "")} 
                          onValueChange={(v) => {
                            if (v === "other") {
                              setIsCustomNationality(true);
                              setCustomNationality(formData.nationality || "");
                            } else {
                              setFormData({...formData, nationality: v});
                            }
                          }}
                        >
                          <SelectTrigger className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {nationalities.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                            <SelectItem value="other" className="font-bold text-indigo-600">Autre...</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Écrire la nationalité..."
                            value={customNationality}
                            onChange={(e) => {
                              setCustomNationality(e.target.value);
                              setFormData({...formData, nationality: e.target.value});
                            }}
                            className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                            autoFocus
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsCustomNationality(false)}
                            className="h-12 px-3 hover:bg-slate-100 rounded-xl text-slate-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Ville <span className="text-red-500">*</span></Label>
                  {!isCustomCity ? (
                    <Select 
                      value={cities.includes(formData.city || "") ? formData.city : (formData.city ? "other" : "")} 
                      onValueChange={(v) => {
                        if (v === "other") {
                          setIsCustomCity(true);
                          setCustomCity(formData.city || "");
                        } else {
                          setFormData({...formData, city: v});
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        <SelectItem value="other" className="font-bold text-indigo-600">Autre...</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Écrire la ville..."
                        value={customCity}
                        onChange={(e) => {
                          setCustomCity(e.target.value);
                          setFormData({...formData, city: e.target.value});
                        }}
                        className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                        autoFocus
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setIsCustomCity(false)}
                        className="h-12 px-3 hover:bg-slate-100 rounded-xl text-slate-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Code Postal</Label>
                  <Input 
                    placeholder="1000"
                    value={formData.postal_code || ""}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value.replace(/[^\d]/g, '').slice(0, 5)})}
                    className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                  />
                </div>
                {formData.type === 'company' && (
                    <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Pays</Label>
                    {!isCustomCountry ? (
                      <Select 
                        value={countries.includes(formData.country || "") ? formData.country : (formData.country ? "other" : "")} 
                        onValueChange={(v) => {
                          if (v === "other") {
                            setIsCustomCountry(true);
                            setCustomCountry(formData.country || "");
                          } else {
                            setFormData({...formData, country: v});
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          <SelectItem value="other" className="font-bold text-indigo-600">Autre...</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Écrire le pays..."
                          value={customCountry}
                          onChange={(e) => {
                            setCustomCountry(e.target.value);
                            setFormData({...formData, country: e.target.value});
                          }}
                          className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                          autoFocus
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setIsCustomCountry(false)}
                          className="h-12 px-3 hover:bg-slate-100 rounded-xl text-slate-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Adresse</Label>
                  <Input 
                    placeholder="Adresse complète"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Observation (Arabe supporté)</Label>
                  <Textarea 
                    placeholder="Notes particulières..."
                    value={formData.observation || ""}
                    onChange={(e) => setFormData({...formData, observation: e.target.value})}
                    className="rounded-xl border-slate-200 focus:ring-indigo-500 min-h-[100px] text-base"
                    dir="auto"
                  />
                </div>
              </div>
            </section>

            {/* Identification Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Identification</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Type de pièce d'identité {formData.type === 'company' ? "(ou doc entreprise)" : <span className="text-red-500">*</span>}</Label>
                  {formData.type === 'company' ? (
                    <div className="px-4 h-12 flex items-center bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
                      Registre de Commerce
                    </div>
                  ) : (
                    <Select 
                      value={formData.id_type || ""} 
                      onValueChange={(v) => setFormData({...formData, id_type: v})}
                    >
                      <SelectTrigger 
                        className="rounded-xl h-12 border-slate-200 text-base"
                        showClear={!!formData.id_type}
                        onClear={() => setFormData({...formData, id_type: ""})}
                      >
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CIN">CIN</SelectItem>
                        <SelectItem value="Passport">Passeport</SelectItem>
                        <SelectItem value="Carte de séjour">Carte de séjour</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Numéro de pièce {formData.type === 'individual' && <span className="text-red-500">*</span>}</Label>
                  <Input 
                    placeholder="Numéro"
                    value={formData.id_number || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (formData.id_type === "CIN") {
                        setFormData({...formData, id_number: val.replace(/[^\d]/g, '').slice(0, 8)});
                      } else {
                        setFormData({...formData, id_number: val.replace(/[^\w]/g, '')});
                      }
                    }}
                    className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                  />
                </div>
                {formData.type === 'individual' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Délivrée le <span className="text-red-500">*</span></Label>
                      <Input 
                        type="date"
                        value={formData.id_issued_date || ""}
                        onChange={(e) => setFormData({...formData, id_issued_date: e.target.value})}
                        className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Lieu de délivrance <span className="text-red-500">*</span></Label>
                      <Input 
                        placeholder="Lieu"
                        value={formData.id_issued_place || ""}
                        onChange={(e) => setFormData({...formData, id_issued_place: e.target.value})}
                        className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Date d'expiration</Label>
                      <Input 
                        type="date"
                        value={formData.id_expiry_date || ""}
                        onChange={(e) => setFormData({...formData, id_expiry_date: e.target.value})}
                        className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* License Section - Only for Individuals */}
            {formData.type === 'individual' && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Permis de Conduire</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Numéro de permis <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="Numéro"
                      value={formData.license_number || ""}
                      onChange={(e) => setFormData({...formData, license_number: e.target.value.replace(/[^\w/\-]/g, '')})}
                      className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Délivré le <span className="text-red-500">*</span></Label>
                    <Input 
                      type="date"
                      value={formData.license_issued_date || ""}
                      onChange={(e) => setFormData({...formData, license_issued_date: e.target.value})}
                      className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Lieu de délivrance <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="Lieu"
                      value={formData.license_issued_place || ""}
                      onChange={(e) => setFormData({...formData, license_issued_place: e.target.value})}
                      className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Date d'expiration</Label>
                    <Input 
                      type="date"
                      value={formData.license_expiry_date || ""}
                      onChange={(e) => setFormData({...formData, license_expiry_date: e.target.value})}
                      className="rounded-xl h-12 border-slate-200 focus:ring-indigo-500 text-base"
                    />
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center">
            <Button 
                variant="outline" 
                onClick={() => {
                    if (editingCustomer) {
                        setFormData({...editingCustomer});
                    } else {
                        setFormData({ 
                            type: 'individual',
                            nationality: 'تونسية',
                            city: 'تونس',
                            country: 'تونس'
                        });
                    }
                }} 
                className="rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            >
                Réinitialiser
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setEditingCustomer(null); }} className="rounded-xl px-6">
                Annuler
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-100 transition-all"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Enregistrement..." : (editingCustomer ? "Mettre à jour" : "Enregistrer")}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestion des Clients</h1>
          <p className="text-slate-500 mt-1">Gérez vos clients particuliers et entreprises</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-12 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau Client
        </Button>
      </div>

      <Tabs defaultValue="all" value={listType} onValueChange={(v: any) => setListType(v)} className="w-full">
        <TabsList className="bg-white/50 p-1 rounded-xl border border-slate-100 w-fit">
          <TabsTrigger value="all" className="rounded-lg px-6">Tous les clients</TabsTrigger>
          <TabsTrigger value="individual" className="rounded-lg px-6">Particuliers</TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg px-6">Entreprises</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-white/50">
          <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input 
                          placeholder="Rechercher par nom, téléphone, CIN..." 
                          className="pl-11 bg-white border-slate-200 rounded-xl h-12 focus-visible:ring-indigo-500 text-base shadow-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-sm font-medium">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Identification</th>
                  <th className="px-6 py-4">Localisation</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="group hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${customer.type === 'company' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {customer.type === 'company' ? <Building2 size={20} /> : <User size={20} />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {customer.type === 'company' ? customer.name : `${customer.name} ${customer.first_name || ''}`}
                            </div>
                            <div className="text-xs text-slate-500">ID: #{customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className={customer.type === 'company' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}>
                          {customer.type === 'company' ? 'Entreprise' : 'Particulier'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-sm text-slate-600">
                              <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-slate-700">
                            {customer.id_type || 'N/A'}
                          </div>
                          <div className="text-xs text-slate-500">
                            N°: {customer.id_number || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                          {customer.city || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full hover:bg-white")}>
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem 
                              onClick={() => handleOpenHistory(customer)}
                              className="cursor-pointer"
                            >
                              <Calendar className="w-4 h-4 mr-2" /> Historique
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenDialog(customer)}
                              className="cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4 mr-2" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(customer.id)}
                              className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredCustomers.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
            {filteredCustomers.length === 0 && !loading && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Aucun client trouvé</h3>
                <p className="text-slate-500">Essayez de modifier vos critères de recherche</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Historique des Locations
              </DialogTitle>
              <DialogDescription>
                {editingCustomer?.name} {editingCustomer?.first_name}
              </DialogDescription>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Prix Total</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Reste</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerHistory.map((rental) => (
                  <TableRow key={rental.id}>
                    <TableCell className="font-medium">
                      {rental.brand} {rental.model}
                      <div className="text-xs text-slate-500">{rental.registration}</div>
                    </TableCell>
                    <TableCell>
                      {rental.start_date} au {rental.end_date}
                    </TableCell>
                    <TableCell>{rental.total_price} DT</TableCell>
                    <TableCell className="text-green-600">{rental.amount_paid || 0} DT</TableCell>
                    <TableCell className="text-red-600">{(rental.total_price || 0) - (rental.amount_paid || 0)} DT</TableCell>
                    <TableCell>
                      <Badge variant={rental.status === 'active' ? "default" : "secondary"}>
                        {rental.status === 'active' ? "En cours" : "Terminée"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {customerHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400 italic">
                      Aucune location enregistrée pour ce client.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirmOpen(false);
          setCustomerToDelete(null);
          setAssociatedRentalsForDelete([]);
        }
      }}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" /> 
              {associatedRentalsForDelete.length > 0 ? "Suppression du client avec historique" : "Confirmer la suppression"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-2 text-sm leading-relaxed">
              {associatedRentalsForDelete.length > 0 ? (
                <>
                  Le client <span className="font-semibold text-slate-900">{customerToDelete?.name || ""} {customerToDelete?.first_name || ""}</span> possède déjà des réservations ou contrats de location enregistrés (clôturés ou annulés). 
                  Pour pouvoir supprimer ce client, l'ensemble de ses contrats associés doit également être supprimé.
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer définitivement le client <span className="font-semibold text-slate-900">{customerToDelete?.name || ""} {customerToDelete?.first_name || ""}</span> ? Cette action supprimera également toutes ses données personnelles enregistrées.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {associatedRentalsForDelete.length > 0 && (
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 my-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Statuts de ses réservations / contrats :
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> En cours
                  </span>
                  <span className="font-bold text-slate-900">
                    {associatedRentalsForDelete.filter((r: any) => r.status === 'active').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Programmé
                  </span>
                  <span className="font-bold text-slate-900">
                    {associatedRentalsForDelete.filter((r: any) => r.status === 'scheduled').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Clôturé
                  </span>
                  <span className="font-bold text-slate-900">
                    {associatedRentalsForDelete.filter((r: any) => r.status === 'completed').length}
                  </span>
                </div>
                {associatedRentalsForDelete.filter((r: any) => r.status === 'cancelled').length > 0 && (
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Annulé
                    </span>
                    <span className="font-bold text-slate-700">
                      {associatedRentalsForDelete.filter((r: any) => r.status === 'cancelled').length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-xs font-medium leading-relaxed">
            ⚠️ <span className="font-bold">Attention :</span> {associatedRentalsForDelete.length > 0 ? (
              `Confirmer cette action supprimera définitivement le client ainsi que l'intégralité de ses ${associatedRentalsForDelete.length} contrats de location associés. Cette opération est irréversible.`
            ) : (
              "Cette opération est irréversible et toutes les données du client seront définitivement effacées du système."
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setCustomerToDelete(null);
                setAssociatedRentalsForDelete([]);
              }}
              className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-medium w-full sm:w-auto"
              disabled={checkingDelete}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteCascade}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 w-full sm:w-auto flex items-center justify-center gap-1.5"
              disabled={checkingDelete}
            >
              {checkingDelete ? "Suppression en cours..." : (associatedRentalsForDelete.length > 0 ? "Conserver et tout supprimer" : "Oui, supprimer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteBlockedOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteBlockedOpen(false);
          setCustomerToDelete(null);
          setAssociatedRentalsForDelete([]);
        }
      }}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-600 flex items-center gap-2">
              <span className="w-5 h-5 text-amber-600 border-2 border-amber-600 rounded-full flex items-center justify-center text-xs font-extrabold font-sans">!</span> Suppression Impossible
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-2 text-sm leading-relaxed">
              Le client <span className="font-semibold text-slate-900">{customerToDelete?.name || ""} {customerToDelete?.first_name || ""}</span> ne peut pas être supprimé car il possède des locations déjà affectées.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 my-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contrats de location associés :
            </h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {associatedRentalsForDelete.map((rental: any) => (
                <div key={rental.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 text-sm">
                  <div className="pr-2">
                    <div className="font-medium text-slate-800">{rental.brand} {rental.model}</div>
                    <div className="text-[11px] text-slate-500">Contrat #{rental.id} - du {rental.start_date} au {rental.end_date}</div>
                  </div>
                  <Badge variant={rental.status === 'active' ? "default" : "secondary"} className={rental.status === 'active' ? "bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px]"}>
                    {rental.status === 'active' ? "En cours" : rental.status === 'completed' ? "Terminé" : "Programmé"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 text-xs font-medium leading-relaxed">
            ⚠️ <span className="font-bold">Remarque :</span> Pour pouvoir supprimer ce client, il ne doit être lié à aucun contrat de location.
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              onClick={() => {
                setDeleteBlockedOpen(false);
                setCustomerToDelete(null);
                setAssociatedRentalsForDelete([]);
              }}
              className="bg-slate-950 hover:bg-slate-850 text-white font-semibold rounded-xl w-full h-11"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
