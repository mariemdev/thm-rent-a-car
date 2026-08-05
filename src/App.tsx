import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  LayoutDashboard, 
  Car, 
  Building2, 
  MapPin, 
  Key, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Globe,
  ChevronRight,
  Plus,
  Search,
  Bell,
  FileText,
  TrendingUp,
  Calendar as CalendarIcon,
  AlertTriangle,
  Coins
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cars from "./pages/Cars";
import Rentals from "./pages/Rentals";
import Branches from "./pages/Branches";
import Customers from "./pages/Customers";
import Alerts from "./pages/Alerts";
import Recettes from "./pages/Recettes";
import UsersPage from "./pages/Users";
import { Users as UsersIcon } from "lucide-react";

const Sidebar = ({ mobile = false, setOpen }: { mobile?: boolean, setOpen?: (o: boolean) => void }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const groups = [
    {
      title: t("nav.group_general"),
      items: [
        { icon: LayoutDashboard, label: t("nav.dashboard"), path: "/" },
      ]
    },
    {
      title: t("nav.group_operations"),
      items: [
        { icon: Key, label: t("nav.rentals"), path: "/rentals" },
        ...(user.role !== 'agent' ? [{ icon: Coins, label: "Recettes de location", path: "/recettes" }] : []),
      ]
    },
    {
      title: t("nav.group_contacts"),
      items: [
        { icon: Users, label: "Clients", path: "/customers" },
      ]
    },
    {
      title: t("nav.group_fleet"),
      items: [
        { icon: Car, label: t("nav.cars"), path: "/cars" },
        ...(user.role !== 'agent' ? [{ icon: MapPin, label: t("nav.branches"), path: "/branches" }] : []),
      ]
    },
    ...(user.role !== 'agent' ? [{
      title: t("nav.group_system"),
      items: [
        { icon: UsersIcon, label: "Utilisateurs", path: "/users" }
      ]
    }] : [])
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 overflow-y-auto custom-scrollbar">
      <div className="p-6 flex items-center gap-3 sticky top-0 bg-slate-900 z-10 border-b border-slate-800/50">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Car className="w-6 h-6" />
        </div>
        <span className="font-bold text-xl tracking-tight">THM RENT A CAR</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-6 mt-6 pb-6">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
              {group.title}
            </h3>
            {group.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen?.(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  location.pathname === item.path 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className={`w-4 h-4 ${location.pathname === item.path ? "text-white" : "group-hover:text-blue-400"}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {location.pathname === item.path && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-blue-400">
            {user.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate uppercase">{user.role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
        >
          <LogOut className="w-5 h-5 mr-3" />
          {t("nav.logout")}
        </Button>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const cars = await api.getCars();
        let count = 0;
        cars.forEach((car: any) => {
          if (car.next_oil_change_mileage && car.next_oil_change_mileage - car.mileage <= 280) count++;
          if (car.technical_inspection_expiry_date && differenceInDays(parseISO(car.technical_inspection_expiry_date), new Date()) <= 15) count++;
          if (car.insurance_expiry_date && differenceInDays(parseISO(car.insurance_expiry_date), new Date()) <= 15) count++;
          if (car.vignette_expiry_date && differenceInDays(parseISO(car.vignette_expiry_date), new Date()) <= 15) count++;
        });
        setAlertCount(count);
      } catch (e) {}
    };
    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    const langs = ["fr", "en", "ar"];
    const currentIndex = langs.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % langs.length;
    const nextLang = langs[nextIndex];
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = nextLang;
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case "fr": return "Français";
      case "en": return "English";
      case "ar": return "العربية";
      default: return lang;
    }
  };

  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-6 h-6" />
            </Button>
          } />
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar setOpen={setOpen} />
          </SheetContent>
        </Sheet>
        <h2 className="font-semibold text-slate-800 hidden lg:block">
          {new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        
        <Link to="/alerts">
          <Button variant="ghost" size="icon" className="relative text-slate-600">
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                {alertCount}
              </span>
            )}
          </Button>
        </Link>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLanguage}
          className="flex items-center gap-2 rounded-full border-slate-200 px-3"
        >
          <Globe className="w-4 h-4" />
          <span className="font-bold text-xs">{getLanguageLabel(i18n.language)}</span>
        </Button>
      </div>
    </header>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-slate-50">
              <aside className="hidden lg:block sticky top-0 h-screen">
                <Sidebar />
              </aside>
              <main className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/cars" element={<Cars />} />
                    <Route path="/rentals" element={<Rentals />} />
                    <Route path="/rentals/new" element={<Rentals showAdd={true} />} />
                    <Route path="/branches" element={
                      (() => {
                        const u = JSON.parse(localStorage.getItem("user") || "{}");
                        return u.role !== 'agent' ? <Branches /> : <Navigate to="/" replace />;
                      })()
                    } />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/users" element={
                      (() => {
                        const u = JSON.parse(localStorage.getItem("user") || "{}");
                        return u.role !== 'agent' ? <UsersPage /> : <Navigate to="/" replace />;
                      })()
                    } />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/recettes" element={
                      (() => {
                        const u = JSON.parse(localStorage.getItem("user") || "{}");
                        return u.role !== 'agent' ? <Recettes /> : <Navigate to="/" replace />;
                      })()
                    } />
                  </Routes>
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
