import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, MapPin, Phone, Building2, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { TablePagination } from "@/components/TablePagination";

export default function Branches() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [newBranch, setNewBranch] = useState({ name: "", address: "", phone: "", agency_id: "" });
  const [editingBranch, setEditingBranch] = useState({ name: "", address: "", phone: "", agency_id: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchData = async () => {
    const [b, a] = await Promise.all([api.getBranches(), api.getAgencies()]);
    setBranches(b);
    setAgencies(a);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBranch(newBranch);
      toast.success(t("common.success"));
      setIsAddOpen(false);
      fetchData();
      setNewBranch({ name: "", address: "", phone: "", agency_id: "" });
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateBranch(selectedBranch.id, editingBranch);
      toast.success(t("common.success"));
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteBranch(selectedBranch.id);
      toast.success(t("common.success"));
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    }
  };

  const paginatedBranches = [...branches]
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  const totalPages = Math.ceil(branches.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">{t("nav.branches")}</h1>
        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 rounded-xl">
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un local
        </Button>
      </div>

      {isAddOpen && (
        <Card className="border-none shadow-sm rounded-lg mb-6">
          <CardHeader>
            <CardTitle>Nouveau local</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Nom du local <span className="text-red-500">*</span></Label>
                <Input placeholder="Nom du local" value={newBranch.name || ""} onChange={e => setNewBranch({...newBranch, name: e.target.value, agency_id: agencies[0]?.id?.toString() || ""})} required className="rounded-md" />
              </div>
              <div className="space-y-1">
                <Label>Adresse</Label>
                <Input placeholder="Adresse" value={newBranch.address || ""} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="rounded-md" />
              </div>
              <div className="space-y-1">
                <Label>Téléphone</Label>
                <Input placeholder="Téléphone" value={newBranch.phone || ""} onChange={e => setNewBranch({...newBranch, phone: e.target.value})} className="rounded-md" />
              </div>
              <div className="lg:col-span-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>{t("common.cancel")}</Button>
                <Button type="submit" className="bg-blue-600">{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isEditOpen && (
        <Card className="border-none shadow-sm rounded-lg mb-6">
          <CardHeader>
            <CardTitle>Modifier le local</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Nom du local <span className="text-red-500">*</span></Label>
                <Input placeholder="Nom du local" value={editingBranch.name || ""} onChange={e => setEditingBranch({...editingBranch, name: e.target.value})} required className="rounded-md" />
              </div>
              <div className="space-y-1">
                <Label>Adresse</Label>
                <Input placeholder="Adresse" value={editingBranch.address || ""} onChange={e => setEditingBranch({...editingBranch, address: e.target.value})} className="rounded-md" />
              </div>
              <div className="space-y-1">
                <Label>Téléphone</Label>
                <Input placeholder="Téléphone" value={editingBranch.phone || ""} onChange={e => setEditingBranch({...editingBranch, phone: e.target.value})} className="rounded-md" />
              </div>
              <div className="lg:col-span-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>{t("common.cancel")}</Button>
                <Button type="submit" className="bg-blue-600">{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedBranches.map((branch) => (
          <Card key={branch.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-slate-100">
                    <MapPin className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{branch.name}</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Branch ID: #{branch.id}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-slate-400")}>
                    <MoreVertical className="w-5 h-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-md">
                    <DropdownMenuItem onClick={() => {
                      setSelectedBranch(branch);
                      setEditingBranch({ name: branch.name, address: branch.address || "", phone: branch.phone || "", agency_id: branch.agency_id?.toString() || "" });
                      setIsEditOpen(true);
                      setIsAddOpen(false);
                    }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => {
                      setSelectedBranch(branch);
                      setIsDeleteOpen(true);
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {agencies.find(a => a.id === branch.agency_id)?.name || "Agency"}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {branch.address || "No address"}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {branch.phone || "No phone"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={branches.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Supprimer le local"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedBranch?.name} ? Cette action est irréversible.`}
      />
    </div>
  );
}
