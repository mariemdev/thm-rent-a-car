import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Car, 
  Key, 
  Users, 
  Coins, 
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar as CalendarIcon,
  PlusCircle,
  PiggyBank,
  Wallet,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const StatCard = ({ title, value, icon: Icon, trend, description, color, linkTo }: any) => {
  const CardWrapper = linkTo ? Link : "div";
  return (
    <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <CardWrapper to={linkTo} className={linkTo ? "block cursor-pointer" : ""}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-105 transition-transform duration-300`}>
              <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            {trend !== undefined && (
              <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</h3>
            <p className="text-2xl font-bold text-slate-900 font-mono">{value}</p>
            <p className="text-xs text-slate-400 mt-2">{description}</p>
          </div>
        </CardContent>
      </CardWrapper>
    </Card>
  );
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAnalytics()
      .then((response) => {
        setData(response);
        setError(null);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError("Impossible de charger les données du tableau de bord.");
        toast.error("Impossible de charger les données du tableau de bord.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Clock className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm text-slate-500 font-semibold">Génération de la vue analytique...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <span className="text-sm text-slate-500 font-semibold">{error || "Aucune donnée disponible"}</span>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-2"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // Calculate percentage of collectables with safe defaults
  const totalContracts = Number(data.financeSummary?.totalContracts || data.totalRevenue || 0);
  const totalReceived = Number(data.financeSummary?.totalReceived || 0);
  const totalRemaining = Number(data.financeSummary?.totalRemaining || 0);
  const activeRentals = Number(data.activeRentals || 0);
  const availableCars = Number(data.availableCars || 0);
  const totalClients = Number(data.totalClients || data.totalCustomers || 0);
  const collectionPercentage = totalContracts > 0 ? (totalReceived / totalContracts) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500" id="live_dashboard">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            Tableau de Bord Client
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Bienvenue sur votre espace de pilotage THM RENT A CAR. Voici les indicateurs clés.
          </p>
        </div>
        
        {/* Quick Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          <Button 
            onClick={() => navigate("/rentals")} 
            className="rounded-xl flex items-center gap-2 px-4 shadow-sm h-10 bg-slate-900 text-white hover:bg-slate-800"
          >
            <PlusCircle className="w-4 h-4" />
            Nouvelle Location
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/recettes")} 
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2 px-4 h-10"
          >
            <Coins className="w-4 h-4 text-emerald-600" />
            Recettes Financières
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Recettes encaissées" 
          value={`${totalReceived.toFixed(3)} DT`} 
          icon={Coins} 
          trend={12.4}
          description="Montant cumulé perçu"
          color="bg-emerald-600"
          linkTo="/recettes"
        />
        <StatCard 
          title="Locations Actives" 
          value={activeRentals} 
          icon={Key} 
          trend={4.5}
          description="Contrats en cours sur route"
          color="bg-indigo-600"
          linkTo="/rentals"
        />
        <StatCard 
          title="Automobiles Disponibles" 
          value={availableCars} 
          icon={Car} 
          description="Prêtes pour réservation"
          color="bg-blue-600"
          linkTo="/cars"
        />
        <StatCard 
          title="Total des Clients" 
          value={totalClients} 
          icon={Users} 
          description="Enregistrés dans l'agence"
          color="bg-amber-600"
          linkTo="/customers"
        />
      </div>

      {/* Upcoming Returns Widget - Real DB values */}
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-white border-b border-slate-100 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Prochains retours attendus (Actifs)</CardTitle>
            <CardDescription className="text-xs">
              Mises en retour les plus proches d'après les dates de fin programmées
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 text-xs px-2.5 py-0.5 rounded-full">
            {data.upcomingReturns?.length || 0} retours imminents
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {data.upcomingReturns && Array.isArray(data.upcomingReturns) && data.upcomingReturns.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.upcomingReturns.map((ret: any, index: number) => {
                const clientName = ret.driver_name || ret.customer_name || "Client Privé";
                const endDate = ret.end_date ? parseISO(ret.end_date) : null;
                const formattedDate = endDate ? format(endDate, "dd/MM/yyyy") : "Date non définie";
                
                return (
                  <div key={ret.id || index} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-905 flex items-center gap-1.5 flex-wrap">
                          <span>{ret.brand || "N/A"} {ret.model || "N/A"}</span>
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                            {ret.registration || "N/A"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{clientName}</span>
                          {ret.customer_phone && <span className="text-slate-400">• {ret.customer_phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 font-semibold block">Date de retour prévue :</span>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate} {ret.return_time ? `à ${ret.return_time}` : ""}
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => navigate(`/rentals`)}
                        className="rounded-lg h-8 px-2.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                        title="Gérer le retour"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/80 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Aucun retour actif imminent à afficher</p>
              <p className="text-xs text-slate-500 mt-0.5">Toutes les voitures louées ont été rendues ou sont à jour.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
