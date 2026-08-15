import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  Save, 
  Image as ImageIcon, 
  FileText,
  AlertCircle,
  Clock,
  Car,
  Download,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { generateContractPDF } from "@/lib/pdf";

const COMPANY_INFO = {
  name: "THM RENT A CAR",
  address: "AVENUE HABIB BOURGUIBA, TUNIS",
  mobile: "+216 20 000 000",
  whatsapp: "+216 20 000 000",
  mf: "1234567/A/B/C/000",
  email: "contact@thm-rentacar.tn"
};

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_whatsapp: "",
    company_mf: "",
    company_email: "",
    company_logo: "",
    km_allowance: 280,
    excess_km_price: 0.5,
    terms_fr: "",
    terms_ar: "",
    vehicle_condition_image: "",
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_pass: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (settings.id) {
        const { id, ...updateData } = settings;
        await api.updateSettings(updateData);
      } else {
        await api.createSettings(settings);
      }
      toast.success("Paramètres enregistrés avec succès");
      fetchSettings(); // Refresh to get the ID
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, company_logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVehicleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, vehicle_condition_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Clock className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-10 h-10 text-blue-600" />
            Configuration Société
          </h1>
          <p className="text-slate-500 mt-1">Gérez les informations de votre entreprise et les paramètres des contrats.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-blue-100 transition-all hover:scale-[1.02]"
        >
          {saving ? <Clock className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Enregistrer les modifications
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informations Société */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Informations Générales
            </CardTitle>
            <CardDescription>Coordonnées qui apparaîtront sur l'entête des contrats.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Nom de la Société</Label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={settings.company_name} 
                    onChange={e => setSettings({...settings, company_name: e.target.value})}
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Email de contact</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    type="email"
                    value={settings.company_email} 
                    onChange={e => setSettings({...settings, company_email: e.target.value})}
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Téléphone</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={settings.company_phone} 
                    onChange={e => setSettings({...settings, company_phone: e.target.value})}
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">WhatsApp</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={settings.company_whatsapp} 
                    onChange={e => setSettings({...settings, company_whatsapp: e.target.value})}
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold text-slate-700">Matricule Fiscal (MF)</Label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={settings.company_mf} 
                    onChange={e => setSettings({...settings, company_mf: e.target.value})}
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold text-slate-700">Adresse</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Textarea 
                    value={settings.company_address} 
                    onChange={e => setSettings({...settings, company_address: e.target.value})}
                    className="pl-10 rounded-xl bg-slate-50 border-slate-200 min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="font-bold text-slate-700">Logo de la Société</Label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                  {settings.company_logo ? (
                    <img src={settings.company_logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                    className="cursor-pointer h-11 rounded-xl border-slate-200"
                  />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Format recommandé: PNG ou JPG, max 2MB.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres Contrat */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Paramètres du Contrat
            </CardTitle>
            <CardDescription>Conditions par défaut appliquées à tous les nouveaux contrats.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Kilométrage limité (Km/jour)</Label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    type="number"
                    value={settings.km_allowance} 
                    onChange={e => setSettings({...settings, km_allowance: parseInt(e.target.value)})}
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Prix Km supplémentaire (DT)</Label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    type="number"
                    step="0.1"
                    value={settings.excess_km_price} 
                    onChange={e => setSettings({...settings, excess_km_price: parseFloat(e.target.value)})}
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="font-bold text-slate-700">Image État Véhicule (Schéma)</Label>
              <div className="flex flex-col gap-4">
                <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                  {settings.vehicle_condition_image ? (
                    <img src={settings.vehicle_condition_image} alt="Vehicle State" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-center space-y-2">
                      <Car className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-sm text-slate-400 font-medium">Aucune image sélectionnée</p>
                    </div>
                  )}
                </div>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleVehicleImageUpload}
                  className="cursor-pointer h-11 rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Configuration SMTP */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Configuration Email (SMTP)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Serveur SMTP</Label>
                  <Input 
                    value={settings.smtp_host || ""} 
                    onChange={e => setSettings({...settings, smtp_host: e.target.value})}
                    placeholder="smtp.gmail.com"
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Port SMTP</Label>
                  <Input 
                    type="number"
                    value={settings.smtp_port || ""} 
                    onChange={e => setSettings({...settings, smtp_port: e.target.value})}
                    placeholder="465"
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Email SMTP</Label>
                  <Input 
                    type="email"
                    value={settings.smtp_user || ""} 
                    onChange={e => setSettings({...settings, smtp_user: e.target.value})}
                    placeholder="votre-email@gmail.com"
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Mot de passe SMTP</Label>
                  <Input 
                    type="password"
                    value={settings.smtp_pass || ""} 
                    onChange={e => setSettings({...settings, smtp_pass: e.target.value})}
                    placeholder="Mot de passe d'application"
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <p className="text-amber-800 text-sm">
                  <strong>Note :</strong> Pour Gmail, utilisez un mot de passe d'application. Activez la vérification en 2 étapes sur votre compte Google, puis générez un mot de passe d'application dans les paramètres de sécurité.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Conditions Générales (Français)</Label>
                <Textarea 
                  value={settings.terms_fr} 
                  onChange={e => setSettings({...settings, terms_fr: e.target.value})}
                  className="rounded-xl bg-slate-50 border-slate-200 min-h-[100px] text-sm leading-relaxed"
                  placeholder="Texte qui apparaîtra au dessus de la signature..."
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 text-right block">الشروط العامة (العربية)</Label>
                <Textarea 
                  dir="rtl"
                  value={settings.terms_ar} 
                  onChange={e => setSettings({...settings, terms_ar: e.target.value})}
                  className="rounded-xl bg-slate-50 border-slate-200 min-h-[100px] text-sm leading-relaxed font-arabic"
                  placeholder="النص الذي سيظهر فوق التوقيع..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-blue-900">Note importante</h4>
          <p className="text-blue-700 text-sm mt-1 leading-relaxed">
            Ces paramètres sont globaux. Toute modification du kilométrage ou des prix sera appliquée à tous les nouveaux contrats créés après l'enregistrement. Les anciens contrats conserveront les valeurs au moment de leur création.
          </p>
        </div>
      </div>

      {/* Modèle de Contrat */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b p-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Modèle de Contrat
              </CardTitle>
              <CardDescription>Aperçu du contrat avec vos informations actuelles.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => generateContractPDF(null, settings)}>
                <Download className="w-4 h-4 mr-2" /> Télécharger Modèle
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => generateContractPDF(null, settings)}>
                <Printer className="w-4 h-4 mr-2" /> Imprimer Modèle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="max-w-4xl mx-auto space-y-8 border p-8 rounded-xl bg-white shadow-inner">
            <div className="flex justify-between items-start border-b pb-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">{settings.company_name || COMPANY_INFO.name}</h2>
                <p className="text-slate-500 font-medium">{settings.company_address || COMPANY_INFO.address}</p>
                <div className="flex gap-4 text-sm text-slate-400 font-bold">
                  <span>Tél: {settings.company_phone || COMPANY_INFO.mobile}</span>
                  <span>WhatsApp: {settings.company_whatsapp || COMPANY_INFO.whatsapp}</span>
                </div>
                <p className="text-sm text-slate-400 font-bold">MF: {settings.company_mf || COMPANY_INFO.mf}</p>
                <p className="text-sm text-slate-400 font-bold">Email: {settings.company_email || COMPANY_INFO.email}</p>
              </div>
              <div className="text-right space-y-4">
                {settings.company_logo ? (
                  <img src={settings.company_logo} alt="Logo" className="h-20 w-auto ml-auto object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">CONTRAT DE LOCATION</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Modèle Officiel THM</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-sm border-l-4 border-blue-600 pl-3">Conditions de Location</h4>
                <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
                  <li>Âge minimum exigé 25 ans</li>
                  <li>Permis délivré depuis au moins 2 ans</li>
                  <li>Kilométrage limité à {settings.km_allowance || 280} Km/jour</li>
                  <li>Excès facturé à base de {settings.excess_km_price || 0.5} DT / Km</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-sm border-l-4 border-blue-600 pl-3">État du Véhicule</h4>
                <div className="aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {settings.vehicle_condition_image ? (
                    <img src={settings.vehicle_condition_image} alt="Vehicle State" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Car className="w-12 h-12 text-slate-300" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t">
              <p className="text-xs text-slate-500 leading-relaxed italic">
                * {settings.terms_fr || "Le locataire soussigné accepte sans réserve les conditions générales de location figurant au verso dont il a pris connaissance et s'engage à restituer le véhicule à la date prévue ci-dessus."}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed italic text-right font-arabic">
                * {settings.terms_ar || "إطلعت علي المعلومات و الشروط الموجودة أعلاه و في الخلف و وافقت عليها"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
