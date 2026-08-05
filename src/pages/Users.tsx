import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  Search, 
  UserPlus, 
  Shield, 
  Mail, 
  Building2, 
  MapPin, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff
} from "lucide-react";
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TablePagination } from "@/components/TablePagination";

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent",
    agency_id: "",
    branch_id: "",
    is_verified: 1
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, a, b] = await Promise.all([
        api.getUsers(),
        currentUser.role === 'superadmin' ? api.getAgencies() : Promise.resolve([]),
        api.getBranches()
      ]);
      setUsers(u);
      setAgencies(a);
      setBranches(b);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      toast.success("Utilisateur créé avec succès");
      setIsAddOpen(false);
      fetchData();
      setNewUser({ name: "", email: "", password: "", role: "agent", agency_id: "", branch_id: "", is_verified: 1 });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateUser(editingUser.id, editingUser);
      toast.success("Utilisateur mis à jour");
      setIsEditOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.deleteUser(selectedUser.id);
      toast.success("Utilisateur supprimé");
      setIsDeleteOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedUsers = filteredUsers
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-purple-100 text-purple-700 border-none">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-700 border-none">Admin</Badge>;
      case 'agent':
        return <Badge className="bg-slate-100 text-slate-700 border-none">Agent</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getVerificationBadge = (is_verified: number) => {
    if (is_verified === 1) {
      return <Badge className="bg-green-100 text-green-700 border-none text-[10px] py-0.5 px-2">Vérifié</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] py-0.5 px-2">Non Vérifié</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-slate-500 mt-1">Gérez les comptes et les permissions de votre équipe</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
          <UserPlus className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/60 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Rechercher un utilisateur..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Utilisateur</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Rôle</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Agence / Local</TableHead>
                <TableHead className="text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-48 text-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div></TableCell></TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-48 text-center text-slate-500">Aucun utilisateur trouvé.</TableCell></TableRow>
              ) : paginatedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {getRoleBadge(user.role)}
                      {getVerificationBadge(user.is_verified)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {agencies.find(a => a.id === user.agency_id)?.name || "N/A"}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        {branches.find(b => b.id === user.branch_id)?.name || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        onClick={() => {
                          setEditingUser(user);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDeleteOpen(true);
                        }}
                        disabled={user.id === currentUser.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredUsers.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Nouvel Utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Nom complet</Label>
                <Input 
                  value={newUser.name} 
                  onChange={e => setNewUser({...newUser, name: e.target.value})} 
                  required 
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Rôle</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser.role === 'superadmin' && <SelectItem value="superadmin">Super Admin</SelectItem>}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Email</Label>
              <Input 
                type="email" 
                value={newUser.email} 
                onChange={e => setNewUser({...newUser, email: e.target.value})} 
                required 
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Mot de passe</Label>
              <div className="relative">
                <Input 
                  type={showAddPassword ? "text" : "password"} 
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                  required 
                  className="rounded-xl border-slate-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPassword(!showAddPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {currentUser.role === 'superadmin' && (
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Agence</Label>
                <Select value={newUser.agency_id} onValueChange={v => setNewUser({...newUser, agency_id: v})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Choisir une agence" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Local (Optionnel)</Label>
              <Select value={newUser.branch_id} onValueChange={v => setNewUser({...newUser, branch_id: v})}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Choisir un local" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter(b => currentUser.role === 'superadmin' ? b.agency_id?.toString() === newUser.agency_id : true)
                    .map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Statut du compte</Label>
              <Select value={newUser.is_verified.toString()} onValueChange={v => setNewUser({...newUser, is_verified: parseInt(v)})}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Activer et Vérifier immédiatement (Recommandé)</SelectItem>
                  <SelectItem value="0">Envoyer un e-mail de vérification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl">Annuler</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Modifier l'Utilisateur</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Nom complet</Label>
                  <Input 
                    value={editingUser.name || ""} 
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
                    required 
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Rôle</Label>
                  <Select value={editingUser.role || "agent"} onValueChange={v => setEditingUser({...editingUser, role: v})}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUser.role === 'superadmin' && <SelectItem value="superadmin">Super Admin</SelectItem>}
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Email</Label>
                <Input 
                  type="email" 
                  value={editingUser.email || ""} 
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
                  required 
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
                <div className="relative">
                  <Input 
                    type={showEditPassword ? "text" : "password"} 
                    value={editingUser.password || ""} 
                    onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                    className="rounded-xl border-slate-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {currentUser.role === 'superadmin' && (
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Agence</Label>
                  <Select value={editingUser.agency_id?.toString() || ""} onValueChange={v => setEditingUser({...editingUser, agency_id: v})}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Choisir une agence" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Local (Optionnel)</Label>
                <Select value={editingUser.branch_id?.toString() || ""} onValueChange={v => setEditingUser({...editingUser, branch_id: v})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Choisir un local" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches
                      .filter(b => currentUser.role === 'superadmin' ? b.agency_id?.toString() === (editingUser.agency_id?.toString() || "") : true)
                      .map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Statut du compte</Label>
                <Select value={(editingUser.is_verified ?? 1).toString()} onValueChange={v => setEditingUser({...editingUser, is_verified: parseInt(v)})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Vérifié / Activé</SelectItem>
                    <SelectItem value="0">Non Vérifié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl">Annuler</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8">Enregistrer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteUser}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedUser?.name} ? Cette action est irréversible.`}
      />
    </div>
  );
}
