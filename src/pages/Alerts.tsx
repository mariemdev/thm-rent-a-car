import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  AlertTriangle, 
  AlertCircle, 
  Bell, 
  Car, 
  Calendar, 
  Droplets, 
  Shield, 
  Search,
  Filter,
  ChevronRight,
  Wrench
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { TablePagination } from "@/components/TablePagination";

interface Alert {
  id: string;
  carId: number;
  registration: string;
  brand: string;
  model: string;
  type: 'oil' | 'inspection' | 'insurance' | 'vignette';
  severity: 'critical' | 'warning';
  description: string;
  value: string | number;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const cars = await api.getCars();
      const newAlerts: Alert[] = [];

      cars.forEach((car: any) => {
        // Oil Change Alert
        if (car.next_oil_change_mileage) {
          const remainingKm = car.next_oil_change_mileage - car.mileage;
          if (remainingKm <= 0) {
            newAlerts.push({
              id: `oil-crit-${car.id}`,
              carId: car.id,
              registration: car.registration,
              brand: car.brand,
              model: car.model,
              type: 'oil',
              severity: 'critical',
              description: "Il faut immédiatement effectuer une vidange.",
              value: `${car.mileage} km`
            });
          } else if (remainingKm <= 280) {
            newAlerts.push({
              id: `oil-warn-${car.id}`,
              carId: car.id,
              registration: car.registration,
              brand: car.brand,
              model: car.model,
              type: 'oil',
              severity: 'warning',
              description: `Il manque ${remainingKm} km pour effectuer une vidange.`,
              value: `${car.mileage} km`
            });
          }
        }

        // Technical Inspection Alert
        if (car.technical_inspection_expiry_date) {
          const daysLeft = differenceInDays(parseISO(car.technical_inspection_expiry_date), new Date());
          if (daysLeft <= 0) {
            newAlerts.push({
              id: `insp-crit-${car.id}`,
              carId: car.id,
              registration: car.registration,
              brand: car.brand,
              model: car.model,
              type: 'inspection',
              severity: 'critical',
              description: "La visite technique du véhicule a expiré (dépassée).",
              value: format(parseISO(car.technical_inspection_expiry_date), 'dd/MM/yyyy')
            });
          } else if (daysLeft <= 15) {
            newAlerts.push({
              id: `insp-warn-${car.id}`,
              carId: car.id,
              registration: car.registration,
              brand: car.brand,
              model: car.model,
              type: 'inspection',
              severity: 'warning',
              description: `Il manque ${daysLeft} jours pour effectuer la visite technique du véhicule (avertissement).`,
              value: format(parseISO(car.technical_inspection_expiry_date), 'dd/MM/yyyy')
            });
          }
        }

        // Insurance Alert
        if (car.insurance_expiry_date) {
          const daysLeft = differenceInDays(parseISO(car.insurance_expiry_date), new Date());
          if (daysLeft <= 0) {
            newAlerts.push({
              id: `ins-crit-${car.id}`,
              carId: car.id,
              registration: car.registration,
              brand: car.brand,
              model: car.model,
              type: 'insurance',
              severity: 'critical',
              description: "L'assurance du véhicule a expiré (dépassée).",
              value: format(parseISO(car.insurance_expiry_date), 'dd/MM/yyyy')
            });
          } else if (daysLeft <= 15) {
            newAlerts.push({
              id: `ins-warn-${car.id}`,
              carId: car.id,
              registration: car.registration,
              brand: car.brand,
              model: car.model,
              type: 'insurance',
              severity: 'warning',
              description: `L'assurance expire dans ${daysLeft} jours (avertissement).`,
              value: format(parseISO(car.insurance_expiry_date), 'dd/MM/yyyy')
            });
          }
        }

        // Vignette Alert
        if (car.vignette_expiry_date) {
          const daysLeft = differenceInDays(parseISO(car.vignette_expiry_date), new Date());
          if (daysLeft <= 0) {
            newAlerts.push({
              id: `vig-crit-${car.id}`,
              carId: car.id,
              registration: car.registration,
              brand: car.brand,
              model: car.model,
              type: 'vignette',
              severity: 'critical',
              description: "La vignette du véhicule a expiré (dépassée).",
              value: format(parseISO(car.vignette_expiry_date), 'dd/MM/yyyy')
            });
          } else if (daysLeft <= 15) {
            newAlerts.push({
              id: `vig-warn-${car.id}`,
              carId: car.id,
              registration: car.registration,
              brand: car.brand,
              model: car.model,
              type: 'vignette',
              severity: 'warning',
              description: `La vignette expire dans ${daysLeft} jours (avertissement).`,
              value: format(parseISO(car.vignette_expiry_date), 'dd/MM/yyyy')
            });
          }
        }
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(a => 
    a.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Liste des Alertes</h1>
          <p className="text-slate-500 mt-1">Suivi de l'entretien et des documents administratifs</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
              {criticalCount}
            </div>
            <span className="text-sm font-bold text-red-700">Critiques</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
              {warningCount}
            </div>
            <span className="text-sm font-bold text-amber-700">Avertissements</span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-white/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Rechercher par immatriculation..." 
              className="pl-10 bg-slate-50 border-none rounded-xl h-11 focus-visible:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Etat</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Immatriculation</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Valeur Actuelle</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Description</TableHead>
                  <TableHead className="px-6 py-4 text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAlerts.map((alert) => (
                  <TableRow key={alert.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {alert.severity === 'critical' ? (
                          <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs uppercase">
                            <AlertCircle className="w-4 h-4" /> Critique
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase">
                            <AlertTriangle className="w-4 h-4" /> Avertissement
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="font-bold text-slate-900">{alert.registration}</div>
                      <div className="text-xs text-slate-500">{alert.brand} {alert.model}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className="font-mono bg-slate-50">
                        {alert.value}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 max-w-md">
                      <p className="text-sm text-slate-600 leading-relaxed">{alert.description}</p>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Link 
                        to="/cars" 
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-xl hover:bg-indigo-50 hover:text-indigo-600")}
                      >
                        Gérer <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAlerts.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Bell className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-lg font-medium">Aucune alerte en cours</p>
                        <p className="text-sm">Tout est en ordre pour votre flotte</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAlerts.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
