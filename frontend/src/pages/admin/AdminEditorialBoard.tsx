import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  BookOpen, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  Save, 
  X, 
  Loader2, 
  Tag, 
  GraduationCap,
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { 
  getAdminEditorialBoard, 
  createEditor, 
  updateEditor, 
  deleteEditor, 
  toggleEditorStatus, 
  updateEditorialPolicy, 
  resetEditorialPolicy 
} from '../../services/editorial.service';
import type { EditorMember, EditorialPolicy } from '../../types/editorial';
import { SkeletonTable } from '../../components/skeletons/SkeletonTable';

const PREDEFINED_ROLES = [
  'Advisory Editor',
  'Chief Editor',
  'Executive Editor',
  'Academic Editor',
  'Associate Editor',
  'Managing Editor',
  'Section Editor',
  'Editorial Advisor',
  'Guest Editor',
];

const AdminEditorialBoard: React.FC = () => {
  const { showToast } = useNotification();
  const [editors, setEditors] = useState<EditorMember[]>([]);
  const [policy, setPolicy] = useState<EditorialPolicy>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');

  // Modal States
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingEditor, setEditingEditor] = useState<EditorMember | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  
  // Custom Confirmation Modal States
  const [statusConfirmEditor, setStatusConfirmEditor] = useState<EditorMember | null>(null);
  const [deletingEditor, setDeletingEditor] = useState<EditorMember | null>(null);
  const [isPolicyConfirmOpen, setIsPolicyConfirmOpen] = useState(false);
  const [isResetPolicyConfirmOpen, setIsResetPolicyConfirmOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editor Form State
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    categoryTitle: string;
    role: string;
    affiliation: string;
    email: string;
    phone: string;
    areas: string;
    order: number;
    isActive: boolean;
  }>({
    name: '',
    category: 'core',
    categoryTitle: 'Core Editorial Team',
    role: 'Editor',
    affiliation: '',
    email: '',
    phone: '',
    areas: '',
    order: 1,
    isActive: true,
  });

  // Policy Form State (Focused strictly on Editorial Board Policy)
  const [policyText, setPolicyText] = useState('');

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const res = await getAdminEditorialBoard();
      if (res.success) {
        setEditors(res.editors || []);
        setPolicy(res.policy || {});
        setPolicyText(res.policy?.policyText || '');
      } else {
        showToast(res.error || 'Failed to load editorial board', 'error');
      }
    } catch (err: any) {
      console.error('Failed to load editorial board data:', err);
      showToast('Error loading editorial board', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, []);

  // Compute category counts
  const stats = useMemo(() => {
    const total = editors.length;
    const core = editors.filter(e => e.category === 'core').length;
    const academic = editors.filter(e => e.category === 'academic').length;
    const associate = editors.filter(e => e.category === 'associate').length;
    const others = editors.filter(e => !['core', 'academic', 'associate'].includes(e.category)).length;
    const active = editors.filter(e => e.isActive !== false).length;
    const hidden = total - active;
    return { total, core, academic, associate, others, active, hidden };
  }, [editors]);

  // Extract unique category keys for tabs
  const categoryTabs = useMemo(() => {
    const defaultTabs = [
      { key: 'all', label: 'All Members', count: editors.length },
      { key: 'core', label: 'Core Team', count: editors.filter(e => e.category === 'core').length },
      { key: 'academic', label: 'Academic Editors', count: editors.filter(e => e.category === 'academic').length },
      { key: 'associate', label: 'Associate Editors', count: editors.filter(e => e.category === 'associate').length },
    ];

    const customKeys = Array.from(new Set(
      editors
        .map(e => e.category)
        .filter(c => !['core', 'academic', 'associate'].includes(c))
    ));

    const customTabs = customKeys.map(k => {
      const match = editors.find(e => e.category === k);
      const label = match?.categoryTitle || (k.charAt(0).toUpperCase() + k.slice(1));
      const count = editors.filter(e => e.category === k).length;
      return { key: k, label, count };
    });

    return [...defaultTabs, ...customTabs];
  }, [editors]);

  // Filtered and sorted editors
  const filteredEditors = useMemo(() => {
    return editors.filter(editor => {
      const matchesTab = selectedCategoryTab === 'all' || editor.category === selectedCategoryTab;
      if (!matchesTab) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        editor.name?.toLowerCase().includes(term) ||
        editor.role?.toLowerCase().includes(term) ||
        editor.affiliation?.toLowerCase().includes(term) ||
        editor.email?.toLowerCase().includes(term) ||
        editor.areas?.toLowerCase().includes(term) ||
        editor.categoryTitle?.toLowerCase().includes(term)
      );
    });
  }, [editors, selectedCategoryTab, searchTerm]);

  const openAddModal = () => {
    setEditingEditor(null);
    const maxOrder = editors.reduce((max, e) => Math.max(max, e.order || 0), 0);
    setFormData({
      name: '',
      category: 'core',
      categoryTitle: 'Core Editorial Team',
      role: 'Advisory Editor',
      affiliation: '',
      email: '',
      phone: '',
      areas: '',
      order: maxOrder + 1,
      isActive: true,
    });
    setIsEditorModalOpen(true);
  };

  const openEditModal = (editor: EditorMember) => {
    setEditingEditor(editor);
    setFormData({
      name: editor.name || '',
      category: editor.category || 'core',
      categoryTitle: editor.categoryTitle || 'Core Editorial Team',
      role: editor.role || 'Editor',
      affiliation: editor.affiliation || '',
      email: editor.email || '',
      phone: editor.phone || '',
      areas: editor.areas || '',
      order: editor.order ?? 1,
      isActive: editor.isActive !== false,
    });
    setIsEditorModalOpen(true);
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please provide the editor name', 'error');
      return;
    }
    if (!formData.category.trim()) {
      showToast('Please select a category', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingEditor?.id) {
        const res = await updateEditor(editingEditor.id, formData);
        if (res.success) {
          showToast('Editor details updated successfully', 'success');
          setIsEditorModalOpen(false);
          fetchBoardData();
        } else {
          showToast(res.error || 'Failed to update editor', 'error');
        }
      } else {
        const res = await createEditor(formData);
        if (res.success) {
          showToast('New editor added to board', 'success');
          setIsEditorModalOpen(false);
          fetchBoardData();
        } else {
          showToast(res.error || 'Failed to create editor', 'error');
        }
      }
    } catch (err: any) {
      console.error('Save editor error:', err);
      showToast(err.message || 'Error saving editor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Status Toggle (Hiding / Publishing)
  const confirmToggleStatus = async () => {
    if (!statusConfirmEditor?.id) return;
    const newStatus = !(statusConfirmEditor.isActive !== false);
    try {
      setIsSubmitting(true);
      const res = await toggleEditorStatus(statusConfirmEditor.id, newStatus);
      if (res.success) {
        showToast(`Editor ${newStatus ? 'published' : 'hidden'} successfully`, 'success');
        setEditors(prev => prev.map(e => e.id === statusConfirmEditor.id ? { ...e, isActive: newStatus } : e));
        setStatusConfirmEditor(null);
      } else {
        showToast(res.error || 'Failed to toggle status', 'error');
      }
    } catch (err: any) {
      console.error('Toggle status error:', err);
      showToast('Error updating status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const confirmDeleteEditor = async () => {
    if (!deletingEditor?.id) return;
    try {
      setIsSubmitting(true);
      const res = await deleteEditor(deletingEditor.id);
      if (res.success) {
        showToast('Editor removed from board', 'success');
        setDeletingEditor(null);
        fetchBoardData();
      } else {
        showToast(res.error || 'Failed to delete editor', 'error');
      }
    } catch (err: any) {
      console.error('Delete editor error:', err);
      showToast('Error deleting editor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initiate Policy Save (triggers confirmation warning)
  const handlePolicyFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPolicyConfirmOpen(true);
  };

  // Execute Policy Save
  const confirmSavePolicy = async () => {
    try {
      setIsSubmitting(true);
      const res = await updateEditorialPolicy({ policyText });
      if (res.success) {
        showToast('Editorial Policy updated successfully', 'success');
        setPolicy(res.policy || { ...policy, policyText });
        setIsPolicyConfirmOpen(false);
        setIsPolicyModalOpen(false);
      } else {
        showToast(res.error || 'Failed to update policy', 'error');
      }
    } catch (err: any) {
      console.error('Save policy error:', err);
      showToast('Error saving policy', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Policy Only to official defaults
  const confirmResetPolicy = async () => {
    try {
      setIsSubmitting(true);
      const res = await resetEditorialPolicy();
      if (res.success) {
        showToast('Editorial Policy restored to official defaults', 'success');
        setPolicy(res.policy || {});
        setPolicyText(res.policy?.policyText || '');
        setIsResetPolicyConfirmOpen(false);
        setIsPolicyModalOpen(false);
      } else {
        showToast(res.error || 'Failed to reset policy', 'error');
      }
    } catch (err: any) {
      console.error('Reset policy error:', err);
      showToast('Error resetting policy', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'ED';
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'core':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'academic':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'associate':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 animate-fade-in font-['Outfit']">
        <div className="flex justify-between items-end gap-6 mb-6">
          <div className="space-y-2">
            <div className="h-8 skeleton-box rounded w-56" />
            <div className="h-4 skeleton-box rounded w-72" />
          </div>
          <div className="h-10 skeleton-box rounded-xl w-64" />
        </div>
        <SkeletonTable rowsCount={6} colsCount={5} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4 font-['Outfit'] space-y-8 pb-12">
      {/* Header Section with Live Search & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <BookOpen size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Scholarly Governance</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Editorial Board Management</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-xl leading-relaxed">
            Manage the distinguished editors, roles, affiliations, and areas of specialization for the Bulletin of Kerala Mathematics Association.
          </p>
        </div>

        {/* Search & Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-nowrap overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 max-w-full">
          {/* Top Live Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
            <input
              type="text"
              placeholder="Search editors, specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-48 sm:w-56 md:w-60 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => {
              setPolicyText(policy.policyText || '');
              setIsPolicyModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-white border border-zinc-200 hover:border-black text-black rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Editorial Policy</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg shadow-black/10 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <UserPlus size={16} />
            <span>Add New Editor</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs Bar */}
      <div className="border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 max-w-full">
          {categoryTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategoryTab(tab.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                selectedCategoryTab === tab.key
                  ? "bg-black text-white shadow-md shadow-black/10"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                selectedCategoryTab === tab.key ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editors Grid View */}
      {filteredEditors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => {
            const isInactive = editor.isActive === false;
            return (
              <div
                key={editor.id || editor.name}
                className={cn(
                  "bg-white border rounded-3xl p-6 flex flex-col justify-between transition-all shadow-sm hover:shadow-md relative group",
                  isInactive ? "opacity-70 border-dashed border-amber-300 bg-amber-50/20" : "border-zinc-200/90 hover:border-black"
                )}
              >
                <div>
                  {/* Top Bar: Badges & Controls */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-black text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm mt-0.5">
                        {getInitials(editor.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-black tracking-tight leading-snug break-words group-hover:text-blue-600 transition-colors">
                          {editor.name}
                        </h3>
                        <p className="text-xs text-zinc-500 font-semibold mt-0.5 leading-normal">
                          {editor.role || 'Editor'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wider",
                        getCategoryBadgeClass(editor.category)
                      )}>
                        {editor.categoryTitle || editor.category}
                      </span>
                    </div>
                  </div>

                  {/* Affiliation & Details */}
                  {editor.affiliation && (
                    <div className="space-y-1 mb-4 text-xs text-zinc-600 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-zinc-100">
                      {editor.affiliation}
                    </div>
                  )}

                  {/* Email */}
                  {editor.email && (
                    <div className="flex items-center gap-2 mb-4 text-xs text-blue-600 font-medium">
                      <Mail size={13} className="shrink-0 text-blue-500" />
                      <a href={`mailto:${editor.email}`} className="hover:underline break-all">
                        {editor.email}
                      </a>
                    </div>
                  )}

                  {/* Areas of Interest */}
                  {editor.areas && (
                    <div className="mb-4 pt-3 border-t border-zinc-100">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        <Tag size={11} />
                        <span>Areas of Specialization</span>
                      </div>
                      <p className="text-xs text-zinc-700 leading-relaxed font-medium bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                        {editor.areas}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Order: #{editor.order ?? 99}
                    </span>
                    {isInactive && (
                      <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                        Hidden
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Visibility Button */}
                    <button
                      onClick={() => setStatusConfirmEditor(editor)}
                      title={isInactive ? "Publish to Public Board" : "Hide from Public Board"}
                      className={cn(
                        "p-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                        isInactive 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                          : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                      )}
                    >
                      {isInactive ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(editor)}
                      title="Edit Editor Details"
                      className="p-2 bg-zinc-50 hover:bg-black hover:text-white text-zinc-700 rounded-xl border border-zinc-200 transition-all cursor-pointer active:scale-95"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingEditor(editor)}
                      title="Delete Editor"
                      className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer active:scale-95"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center flex flex-col items-center gap-4 bg-white rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">No Editors Found</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mt-1">
              {searchTerm ? `No editors match "${searchTerm}".` : 'No editors available in this category.'}
            </p>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-all"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          MODAL: ADD / EDIT EDITOR
      ========================================== */}
      {isEditorModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 font-['Outfit']">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                  {editingEditor ? <Edit3 size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">
                    {editingEditor ? 'Edit Editor Details' : 'Add New Editorial Board Member'}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {editingEditor ? `Updating ${editingEditor.name}` : 'Create new member profile'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditor} className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Krishnamoorthy A."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Designation / Board Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chief Editor, Advisory Editor"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    list="role-suggestions"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                  <datalist id="role-suggestions">
                    {PREDEFINED_ROLES.map(r => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Category & Category Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Category Key <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={['core', 'academic', 'associate', 'advisory'].includes(formData.category) ? formData.category : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'core') {
                        setFormData({ ...formData, category: 'core', categoryTitle: 'Core Editorial Team' });
                      } else if (val === 'academic') {
                        setFormData({ ...formData, category: 'academic', categoryTitle: 'Academic Editors' });
                      } else if (val === 'associate') {
                        setFormData({ ...formData, category: 'associate', categoryTitle: 'Associate Editors' });
                      } else if (val === 'advisory') {
                        setFormData({ ...formData, category: 'advisory', categoryTitle: 'Advisory Board' });
                      } else {
                        setFormData({ ...formData, category: 'custom', categoryTitle: 'Special Committee' });
                      }
                    }}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-black outline-none transition-all cursor-pointer"
                  >
                    <option value="core">Core Editorial Team (core)</option>
                    <option value="academic">Academic Editors (academic)</option>
                    <option value="associate">Associate Editors (associate)</option>
                    <option value="advisory">Advisory Board (advisory)</option>
                    <option value="custom">Custom Category...</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Category Section Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Core Editorial Team"
                    value={formData.categoryTitle}
                    onChange={(e) => setFormData({ ...formData, categoryTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
              </div>

              {/* Affiliation & Postal Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Affiliation, Institution & Address
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Department of Mathematics, Cochin University of Science & Technology, Cochin - 682 022, Kerala, India"
                  value={formData.affiliation}
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Email Address(es)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. akc@cusat.ac.in, akcusat@yahoo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Phone / Contact (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98470 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
              </div>

              {/* Areas of Interest / Specialization */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Areas of Interest / Mathematical Specialization
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Probability Theory, Stochastic Processes, Queueing Theory"
                  value={formData.areas}
                  onChange={(e) => setFormData({ ...formData, areas: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              {/* Order & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl mt-auto">
                  <div>
                    <p className="text-xs font-bold text-black">Active Visibility</p>
                    <p className="text-[10px] text-zinc-400">Display on public website</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 accent-black rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Modal Submit Footer */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-all uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-black/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingEditor ? 'Save Changes' : 'Create Editor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: EDITORIAL POLICY (Focused on Board Content)
      ========================================== */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 font-['Outfit']">
            {/* Header */}
            <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">Editorial Policy</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Official publication objective and scope of the Editorial Board
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Policy Form */}
            <form onSubmit={handlePolicyFormSubmit} className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Editorial Objective & Scope Statement
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Enter the official editorial policy and objectives for the Bulletin of Kerala Mathematics Association..."
                  value={policyText}
                  onChange={(e) => setPolicyText(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all leading-relaxed"
                />
                <p className="text-[11px] text-zinc-400 leading-normal">
                  This text defines the academic publication scope and standard of the Bulletin and is displayed under the Editorial Board section on the public portal.
                </p>
              </div>

              {/* Submit & Reset Policy Footer */}
              <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetPolicyConfirmOpen(true)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Restore Official Text
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPolicyModalOpen(false)}
                    className="px-5 py-3 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-all uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-black/20 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Save size={16} />
                    Save Policy
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          WARNING MODAL: HIDE / PUBLISH EDITOR
      ========================================== */}
      {statusConfirmEditor && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-[2.5rem] p-7 text-center space-y-5 shadow-2xl font-['Outfit'] animate-in zoom-in-95 duration-200">
            {statusConfirmEditor.isActive !== false ? (
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                <AlertTriangle size={28} />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 size={28} />
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-black tracking-tight">
                {statusConfirmEditor.isActive !== false ? 'Hide Editor from Public Website?' : 'Publish Editor to Public Website?'}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                {statusConfirmEditor.isActive !== false ? (
                  <>
                    Are you sure you want to hide <strong className="text-black font-bold">"{statusConfirmEditor.name}"</strong>? 
                    This member will immediately be hidden from the public About Us page and Editorial Board dialog until re-published.
                  </>
                ) : (
                  <>
                    Are you sure you want to publish <strong className="text-black font-bold">"{statusConfirmEditor.name}"</strong>? 
                    This member will become visible on the public website and Editorial Board dialog.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirmEditor(null)}
                className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmToggleStatus}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 py-3.5 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50",
                  statusConfirmEditor.isActive !== false
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                )}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : statusConfirmEditor.isActive !== false ? (
                  'Yes, Hide Editor'
                ) : (
                  'Yes, Publish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          WARNING MODAL: SAVE EDITORIAL POLICY
      ========================================== */}
      {isPolicyConfirmOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-[2.5rem] p-7 text-center space-y-5 shadow-2xl font-['Outfit'] animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
              <ShieldAlert size={28} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-black tracking-tight">
                Update Editorial Policy?
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Saving these changes will immediately update the official publication objective and scope on the public About Us page and Editorial Board modal.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPolicyConfirmOpen(false)}
                className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSavePolicy}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-black/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          WARNING MODAL: RESTORE POLICY TO DEFAULT
      ========================================== */}
      {isResetPolicyConfirmOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-[2.5rem] p-7 text-center space-y-5 shadow-2xl font-['Outfit'] animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
              <RotateCcw size={28} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-black tracking-tight">
                Undo & Restore Default Policy?
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                This will revert the Editorial Policy objective statement back to the official default text.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetPolicyConfirmOpen(false)}
                className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetPolicy}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Restore Default'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          WARNING MODAL: DELETE CONFIRMATION
      ========================================== */}
      {deletingEditor && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-[2.5rem] p-7 text-center space-y-5 shadow-2xl font-['Outfit'] animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
              <Trash2 size={28} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-black tracking-tight">
                Remove Editor?
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Are you sure you want to remove <strong className="text-black font-bold">"{deletingEditor.name}"</strong> from the Editorial Board? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEditor(null)}
                className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteEditor}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEditorialBoard;
