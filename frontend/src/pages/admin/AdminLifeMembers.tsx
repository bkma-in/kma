import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  X,
  User,
  Mail,
  Sparkles,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  UploadCloud,
  Edit3,
  Trash2,
  Eye,
  FileText,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import {
  getLifeMembers,
  addLifeMember,
  importLifeMembers,
  updateLifeMember,
  deleteLifeMember
} from '../../services/user.service';
import { SkeletonTable } from '../../components/skeletons/SkeletonTable';

interface LifeMember {
  id: string;
  uniqueId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  affiliation?: string;
  address?: string;
  notes?: string;
  source: 'admin_enrolled' | 'imported';
  status: string;
  enrolledDate: string;
  hasActiveSubscription: boolean;
  subscriptionId?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: string | null;
  isUserRegistered?: boolean;
  userId?: string | null;
  createdAt?: string;
}

interface ParsedImportRow {
  rowNum: number;
  uniqueId: string;
  email: string;
  name: string;
  status: 'new' | 'duplicate_db' | 'duplicate_file' | 'invalid';
  statusLabel: string;
  matchedMember?: LifeMember;
}

type FilterTab = 'all' | 'subscribed' | 'unsubscribed' | 'admin' | 'imported';
type SortOption = 'newest' | 'oldest' | 'id_asc' | 'email_asc' | 'subscribed_first';

const AdminLifeMembers: React.FC = () => {
  const { showToast, confirm } = useNotification();
  const [members, setMembers] = useState<LifeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LifeMember | null>(null);

  // Form states for Add Member (Only Membership ID and Email are primary)
  const [addForm, setAddForm] = useState({
    uniqueId: '',
    email: '',
    confirmEmail: '',
    name: '',
    sendWelcomeEmail: true
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    id: '',
    uniqueId: '',
    email: '',
    confirmEmail: '',
    name: '',
    status: 'Active'
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importParsedRows, setImportParsedRows] = useState<ParsedImportRow[]>([]);
  const [importConflictMode, setImportConflictMode] = useState<'skip' | 'overwrite'>('skip');
  const [importPreviewFilter, setImportPreviewFilter] = useState<'all' | 'new' | 'duplicates'>('all');
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await getLifeMembers();
      if (response.success && Array.isArray(response.members)) {
        setMembers(response.members);
      } else {
        setMembers([]);
      }
    } catch (error: any) {
      console.error('Failed to load life members:', error);
      showToast('Failed to load life members list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Metric counts
  const totalCount = members.length;
  const subscribedCount = members.filter(m => m.hasActiveSubscription).length;
  const unsubscribedCount = members.filter(m => !m.hasActiveSubscription).length;
  const adminEnrolledCount = members.filter(m => m.source === 'admin_enrolled').length;
  const importedCount = members.filter(m => m.source === 'imported').length;

  // Import preview calculations
  const previewNewCount = importParsedRows.filter(r => r.status === 'new').length;
  const previewDbDuplicateCount = importParsedRows.filter(r => r.status === 'duplicate_db').length;
  const previewFileDuplicateCount = importParsedRows.filter(r => r.status === 'duplicate_file').length;
  const previewTotalDuplicates = previewDbDuplicateCount + previewFileDuplicateCount;
  const previewInvalidCount = importParsedRows.filter(r => r.status === 'invalid').length;

  const filteredPreviewRows = importParsedRows.filter(r => {
    if (importPreviewFilter === 'new') return r.status === 'new';
    if (importPreviewFilter === 'duplicates') return r.status === 'duplicate_db' || r.status === 'duplicate_file';
    return true;
  });

  // Filter and Sort
  const filteredAndSortedMembers = members
    .filter(member => {
      if (filterTab === 'subscribed') {
        if (!member.hasActiveSubscription) return false;
      } else if (filterTab === 'unsubscribed') {
        if (member.hasActiveSubscription) return false;
      } else if (filterTab === 'admin') {
        if (member.source !== 'admin_enrolled') return false;
      } else if (filterTab === 'imported') {
        if (member.source !== 'imported') return false;
      }

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const matchesEmail = (member.email || '').toLowerCase().includes(query);
        const matchesId = (member.uniqueId || '').toLowerCase().includes(query);
        const matchesName = (member.name || '').toLowerCase().includes(query);
        if (!matchesEmail && !matchesId && !matchesName) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'subscribed_first') {
        const aSub = a.hasActiveSubscription ? 1 : 0;
        const bSub = b.hasActiveSubscription ? 1 : 0;
        if (aSub !== bSub) return bSub - aSub;
        return new Date(b.enrolledDate || 0).getTime() - new Date(a.enrolledDate || 0).getTime();
      }
      if (sortBy === 'newest') {
        return new Date(b.enrolledDate || 0).getTime() - new Date(a.enrolledDate || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.enrolledDate || 0).getTime() - new Date(b.enrolledDate || 0).getTime();
      }
      if (sortBy === 'id_asc') {
        return (a.uniqueId || '').localeCompare(b.uniqueId || '');
      }
      if (sortBy === 'email_asc') {
        return (a.email || '').localeCompare(b.email || '');
      }
      return 0;
    });

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Open Add Modal
  const openAddModal = () => {
    setAddForm({
      uniqueId: '',
      email: '',
      confirmEmail: '',
      name: '',
      sendWelcomeEmail: true
    });
    setIsAddModalOpen(true);
  };

  // Handle Add Member submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.uniqueId.trim() || !addForm.email.trim()) {
      showToast('Membership ID and Email Address are required.', 'error');
      return;
    }

    if (!addForm.confirmEmail.trim()) {
      showToast('Please confirm the email address.', 'error');
      return;
    }

    if (addForm.email.trim().toLowerCase() !== addForm.confirmEmail.trim().toLowerCase()) {
      showToast('Email addresses do not match. Please verify and try again.', 'error');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await addLifeMember({
        uniqueId: addForm.uniqueId.trim().toUpperCase(),
        email: addForm.email.trim(),
        name: addForm.name.trim() || addForm.email.trim().split('@')[0],
        sendWelcomeEmail: addForm.sendWelcomeEmail
      });
      if (res.success) {
        showToast(res.message || 'Life Member enrolled successfully!', 'success');
        setIsAddModalOpen(false);
        fetchMembers();
      } else {
        showToast(res.error || 'Failed to add member', 'error');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || error.message || 'Failed to enroll Life Member.', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (member: LifeMember) => {
    setEditForm({
      id: member.id,
      uniqueId: member.uniqueId,
      email: member.email || '',
      confirmEmail: member.email || '',
      name: member.name || '',
      status: member.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Member submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.email.trim()) {
      showToast('Email address is required.', 'error');
      return;
    }

    if (!editForm.confirmEmail.trim()) {
      showToast('Please confirm the email address.', 'error');
      return;
    }

    if (editForm.email.trim().toLowerCase() !== editForm.confirmEmail.trim().toLowerCase()) {
      showToast('Email addresses do not match. Please verify and try again.', 'error');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await updateLifeMember(editForm.id, {
        email: editForm.email.trim(),
        name: editForm.name.trim() || editForm.email.trim().split('@')[0],
        status: editForm.status
      });
      if (res.success) {
        showToast('Life Member updated successfully.', 'success');
        setIsEditModalOpen(false);
        fetchMembers();
      } else {
        showToast(res.error || 'Failed to update member', 'error');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || error.message || 'Failed to update member.', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = (member: LifeMember) => {
    confirm({
      title: 'Remove Life Member',
      message: `Are you sure you want to remove ${member.uniqueId} (${member.email}) from the Life Members registry? This will revoke their 50% concession status.`,
      confirmText: 'Remove Member',
      onConfirm: async () => {
        try {
          const res = await deleteLifeMember(member.id);
          if (res.success) {
            showToast('Life Member removed successfully.', 'success');
            fetchMembers();
          } else {
            showToast(res.error || 'Failed to delete member', 'error');
          }
        } catch (error: any) {
          showToast(error?.response?.data?.error || 'Failed to delete member', 'error');
        }
      }
    });
  };

  // Open Details Modal
  const openDetailsModal = (member: LifeMember) => {
    setSelectedMember(member);
    setIsDetailsModalOpen(true);
  };

  // File selection for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setImportFile(file);
    setImportConflictMode('skip');
    setImportPreviewFilter('all');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const seenIds = new Set<string>();
        const seenEmails = new Set<string>();

        const analyzed: ParsedImportRow[] = jsonRows.map((row, idx) => {
          const rawId = (
            row['Membership ID'] || row['membershipid'] || row['Unique ID'] || row['uniqueId'] || 
            row['id'] || row['ID'] || row['Member ID'] || row['membership'] || ''
          ).toString().trim().toUpperCase();

          const rawEmail = (
            row['Email'] || row['email'] || row['Email Address'] || row['email_id'] || 
            row['Mail'] || row['mail'] || ''
          ).toString().trim();

          const rawName = (
            row['Name'] || row['name'] || row['Full Name'] || row['fullname'] || 
            row['Member Name'] || ''
          ).toString().trim();

          const emailLower = rawEmail.toLowerCase();
          const uniqueId = rawId || `(Auto LM-${idx + 1})`;

          if (!rawEmail || !emailRegex.test(emailLower)) {
            return {
              rowNum: idx + 1,
              uniqueId,
              email: rawEmail || 'Missing Email',
              name: rawName,
              status: 'invalid',
              statusLabel: 'Invalid / Missing Email'
            };
          }

          // Check if already in database (registry)
          const matchedInDb = members.find(m => 
            (rawId && m.uniqueId && m.uniqueId.toUpperCase() === rawId) || 
            (m.email && m.email.toLowerCase() === emailLower)
          );

          if (matchedInDb) {
            return {
              rowNum: idx + 1,
              uniqueId: rawId || matchedInDb.uniqueId,
              email: rawEmail,
              name: rawName || matchedInDb.name,
              status: 'duplicate_db',
              statusLabel: `Already in Registry (${matchedInDb.uniqueId})`,
              matchedMember: matchedInDb
            };
          }

          // Check if duplicate within spreadsheet file
          if ((rawId && seenIds.has(rawId)) || seenEmails.has(emailLower)) {
            return {
              rowNum: idx + 1,
              uniqueId,
              email: rawEmail,
              name: rawName,
              status: 'duplicate_file',
              statusLabel: 'Duplicate in File'
            };
          }

          if (rawId) seenIds.add(rawId);
          seenEmails.add(emailLower);

          return {
            rowNum: idx + 1,
            uniqueId,
            email: rawEmail,
            name: rawName,
            status: 'new',
            statusLabel: 'New Member'
          };
        });

        setImportParsedRows(analyzed);
      } catch (err) {
        console.error('Failed to parse spreadsheet preview:', err);
        showToast('Invalid spreadsheet file format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle Import Submit
  const handleImportSubmit = async () => {
    if (!importFile) {
      showToast('Please select a CSV or Excel file to import.', 'error');
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('conflictMode', importConflictMode);

      const res = await importLifeMembers(formData, importConflictMode);
      if (res.success) {
        showToast(res.message || 'Life members import completed.', 'success');
        fetchMembers();
        setIsImportModalOpen(false);
        setImportFile(null);
        setImportParsedRows([]);
        setImportConflictMode('skip');
        setImportPreviewFilter('all');
      } else {
        showToast(res.error || 'Import failed.', 'error');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || error.message || 'Spreadsheet import failed.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Download Sample Template (Only Membership ID and Email)
  const downloadSampleTemplate = (type: 'csv' | 'xlsx') => {
    const sampleData = [
      {
        'Membership ID': 'LM-1001',
        'Email': 'ramanujan@kma.edu.in'
      },
      {
        'Membership ID': 'LM-1002',
        'Email': 'maya.menon@nitc.ac.in'
      },
      {
        'Membership ID': 'LM-1003',
        'Email': 'george.varghese@mgu.ac.in'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Life_Members');

    if (type === 'csv') {
      XLSX.writeFile(workbook, 'KMA_Life_Members_Template.csv');
    } else {
      XLSX.writeFile(workbook, 'KMA_Life_Members_Template.xlsx');
    }
    showToast(`Sample ${type.toUpperCase()} template downloaded.`, 'success');
  };

  // Export current filtered members to Excel
  const handleExportData = () => {
    if (filteredAndSortedMembers.length === 0) {
      showToast('No records available to export.', 'info');
      return;
    }

    const exportRows = filteredAndSortedMembers.map(m => ({
      'Membership ID': m.uniqueId,
      'Email': m.email,
      'Subscription Status': m.hasActiveSubscription ? 'Active Pass (₹1,000/yr Paid)' : 'Unsubscribed',
      'Pass Expiration': m.subscriptionExpiresAt ? formatDate(m.subscriptionExpiresAt) : 'N/A',
      'Source': m.source === 'admin_enrolled' ? 'Admin Enrolled' : 'CSV/Excel Imported',
      'Date Enrolled': formatDate(m.enrolledDate)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Life_Members');
    XLSX.writeFile(workbook, `KMA_Life_Members_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Life members data exported successfully.', 'success');
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 animate-fade-in font-['Outfit']">
        <div className="flex justify-between items-end gap-6 mb-6">
          <div className="space-y-2">
            <div className="h-8 skeleton-box rounded w-48" />
            <div className="h-4 skeleton-box rounded w-64" />
          </div>
          <div className="h-10 skeleton-box rounded-xl w-64" />
        </div>
        <SkeletonTable rowsCount={6} colsCount={5} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4 font-['Outfit']">
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
            <Crown size={18} />
          </div>
          <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Institutional Registry</h2>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter text-black">KMA Life Members</h1>
        <p className="text-zinc-500 mt-1.5 text-sm max-w-2xl leading-relaxed">
          Manage official Life Members of the Kerala Mathematical Association. Life Members receive a <strong className="text-black">50% concession (₹1,000/year)</strong> verified via their Unique Membership ID and registered email OTP.
        </p>
      </div>

      {/* Compact Overview Stat Metric Cards + Action Buttons Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 mb-8">
        {/* 3 Compact Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Total Life Members */}
          <div
            onClick={() => setFilterTab('all')}
            className={cn(
              "p-3.5 px-4 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between",
              filterTab === 'all'
                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20"
                : "bg-white border-zinc-200 hover:border-zinc-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Crown size={17} />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Total Members</p>
                <h3 className="text-xl font-bold text-black tracking-tight leading-none mt-0.5">{totalCount}</h3>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
              Registry
            </span>
          </div>

          {/* Active Subscribers (50% Concession Paid) */}
          <div
            onClick={() => setFilterTab('subscribed')}
            className={cn(
              "p-3.5 px-4 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between",
              filterTab === 'subscribed'
                ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20"
                : "bg-white border-zinc-200 hover:border-zinc-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <Sparkles size={17} />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Subscribed</p>
                <h3 className="text-xl font-bold text-black tracking-tight leading-none mt-0.5">{subscribedCount}</h3>
              </div>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
              ₹1,000 / Yr
            </span>
          </div>

          {/* Unsubscribed / Pending */}
          <div
            onClick={() => setFilterTab('unsubscribed')}
            className={cn(
              "p-3.5 px-4 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between",
              filterTab === 'unsubscribed'
                ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20"
                : "bg-white border-zinc-200 hover:border-zinc-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                <Clock size={17} />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Unsubscribed</p>
                <h3 className="text-xl font-bold text-black tracking-tight leading-none mt-0.5">{unsubscribedCount}</h3>
              </div>
            </div>
            <span className="text-[9px] font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded-full">
              Eligible
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar next to Cards */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-3 bg-black hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-black/10 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>

          <button
            onClick={() => {
              setImportFile(null);
              setImportParsedRows([]);
              setImportConflictMode('skip');
              setImportPreviewFilter('all');
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Upload size={16} className="text-amber-600" />
            <span>Import CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-900">
            {filterTab === 'all' && `All Registered Members (${totalCount})`}
            {filterTab === 'subscribed' && `Subscribed Members (${subscribedCount})`}
            {filterTab === 'unsubscribed' && `Unsubscribed Members (${unsubscribedCount})`}
          </span>
          {filterTab !== 'all' && (
            <button
              onClick={() => setFilterTab('all')}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>

        {/* Search and Sort controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
            <input
              type="text"
              placeholder="Search Membership ID or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-full sm:w-60 focus:ring-2 focus:ring-black outline-none shadow-sm"
            />
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="pl-8 pr-8 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm text-zinc-700"
            >
              <option value="newest">Sort: Newest Enrolled</option>
              <option value="oldest">Sort: Oldest Enrolled</option>
              <option value="id_asc">Sort: Membership ID</option>
              <option value="email_asc">Sort: Email (A - Z)</option>
              <option value="subscribed_first">Sort: Subscribed First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {filteredAndSortedMembers.length > 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-black/[0.02] overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Membership ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Registered Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">50% Pass Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Source</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Enrolled</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAndSortedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="group hover:bg-amber-50/20 transition-colors"
                  >
                    {/* Unique Membership ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-mono text-xs font-bold">
                          <Crown size={12} className="text-amber-600" />
                          {member.uniqueId}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-zinc-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-900">
                          {member.email}
                        </span>
                      </div>
                    </td>

                    {/* 50% Pass Subscription Status */}
                    <td className="px-6 py-4">
                      {member.hasActiveSubscription ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold tracking-wider uppercase">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Pass Active (₹1,000)
                          </span>
                          {member.subscriptionExpiresAt && (
                            <span className="text-[9px] text-zinc-400 font-medium">
                              Expires {formatDate(member.subscriptionExpiresAt)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 text-[10px] font-bold tracking-wider uppercase">
                          <Clock size={11} className="text-zinc-400" />
                          Not Subscribed
                        </span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="px-6 py-4">
                      {member.source === 'imported' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold uppercase tracking-wider">
                          <FileSpreadsheet size={10} />
                          Imported
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-bold uppercase tracking-wider">
                          <User size={10} />
                          Admin Enrolled
                        </span>
                      )}
                    </td>

                    {/* Enrolled Date */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                        <Calendar size={13} className="text-zinc-400" />
                        <span>{formatDate(member.enrolledDate)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailsModal(member)}
                          className="p-1.5 hover:bg-zinc-100 text-zinc-600 hover:text-black rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-1.5 hover:bg-zinc-100 text-zinc-600 hover:text-black rounded-lg transition-colors cursor-pointer"
                          title="Edit Member"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member)}
                          className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-white rounded-3xl border border-zinc-200 shadow-sm mb-12">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <Crown size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">No Life Members Found</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mt-1">
              {searchTerm.trim() !== ''
                ? `No life member records matched "${searchTerm}".`
                : 'Get started by adding Life Members manually or importing them via CSV / Excel.'}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Add New Member
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Import Spreadsheet
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: ADD LIFE MEMBER (Only ID & Email)           */}
      {/* ==================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">Add Life Member</h3>
                  <p className="text-xs text-zinc-500">Register ID and email for 50% concession verification</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Unique Membership ID *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. LM-1001"
                  value={addForm.uniqueId}
                  onChange={(e) => setAddForm({ ...addForm, uniqueId: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-black outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. member@kma.edu.in"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Confirm Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Re-enter email address to confirm"
                  value={addForm.confirmEmail}
                  onChange={(e) => setAddForm({ ...addForm, confirmEmail: e.target.value })}
                  className={cn(
                    "w-full px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none",
                    addForm.confirmEmail && addForm.email.toLowerCase() !== addForm.confirmEmail.toLowerCase()
                      ? "border-red-300 bg-red-50/30 text-red-900"
                      : "border-zinc-200"
                  )}
                />
                {addForm.confirmEmail && addForm.email.toLowerCase() !== addForm.confirmEmail.toLowerCase() && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">Emails do not match</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">
                  Member Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional Name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sendWelcomeEmail"
                  checked={addForm.sendWelcomeEmail}
                  onChange={(e) => setAddForm({ ...addForm, sendWelcomeEmail: e.target.checked })}
                  className="w-4 h-4 rounded text-black focus:ring-black border-zinc-300"
                />
                <label htmlFor="sendWelcomeEmail" className="text-xs text-zinc-700 font-medium cursor-pointer">
                  Send welcome email notification to member
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-black/10 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdd && <Loader2 size={14} className="animate-spin" />}
                  <span>Enroll Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: BULK IMPORT CSV / EXCEL (Only ID & Email)   */}
      {/* ==================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">Import Life Members Spreadsheet</h3>
                  <p className="text-xs text-zinc-500">Bulk upload membership records (Membership ID and Email)</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Template Download Section */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-black flex items-center gap-1.5">
                  <Download size={14} className="text-amber-600" />
                  Download Simple Template
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Only requires 2 columns: <strong className="text-black">Membership ID</strong> and <strong className="text-black">Email</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadSampleTemplate('xlsx')}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet size={13} className="text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadSampleTemplate('csv')}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileText size={13} className="text-blue-600" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) processSelectedFile(file);
              }}
              className={cn(
                "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                importFile
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-zinc-300 hover:border-black bg-zinc-50/50 hover:bg-zinc-50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                importFile ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"
              )}>
                {importFile ? <Check size={24} /> : <UploadCloud size={24} />}
              </div>

              <div>
                <p className="text-xs font-bold text-black">
                  {importFile ? importFile.name : 'Click to select or drag and drop spreadsheet here'}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Supports CSV, Excel (.xlsx, .xls)
                </p>
              </div>
            </div>

            {/* Overview Stats Bar */}
            {importParsedRows.length > 0 && (
              <div className="mt-6 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-zinc-900">Total in File: {importParsedRows.length}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {previewNewCount} New
                  </span>
                  {previewTotalDuplicates > 0 && (
                    <>
                      <span className="text-zinc-300">•</span>
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        {previewTotalDuplicates} Duplicates / Existing
                      </span>
                    </>
                  )}
                  {previewInvalidCount > 0 && (
                    <>
                      <span className="text-zinc-300">•</span>
                      <span className="text-red-600 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                        {previewInvalidCount} Invalid
                      </span>
                    </>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImportPreviewFilter('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                      importPreviewFilter === 'all'
                        ? "bg-black text-white"
                        : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                    )}
                  >
                    All ({importParsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportPreviewFilter('new')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                      importPreviewFilter === 'new'
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                    )}
                  >
                    New ({previewNewCount})
                  </button>
                  {previewTotalDuplicates > 0 && (
                    <button
                      type="button"
                      onClick={() => setImportPreviewFilter('duplicates')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                        importPreviewFilter === 'duplicates'
                          ? "bg-amber-600 text-white"
                          : "bg-white text-amber-800 border border-amber-300 hover:bg-amber-50"
                      )}
                    >
                      Duplicates ({previewTotalDuplicates})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Duplicate Conflict Resolution Choice */}
            {importParsedRows.length > 0 && previewTotalDuplicates > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>Duplicate Records Detected ({previewTotalDuplicates} records already exist)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Some membership IDs or emails in this spreadsheet are already registered in the Life Members registry. Choose how you want to handle these duplicates:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <label
                    onClick={() => setImportConflictMode('skip')}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all",
                      importConflictMode === 'skip'
                        ? "bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                        : "bg-white/60 border-amber-200 hover:bg-white"
                    )}
                  >
                    <input
                      type="radio"
                      name="conflictMode"
                      checked={importConflictMode === 'skip'}
                      onChange={() => setImportConflictMode('skip')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-zinc-900 block text-xs">Skip Duplicates (Recommended)</span>
                      <span className="text-[10px] text-zinc-500">Only import new unique members. Existing registry members will remain untouched.</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportConflictMode('overwrite')}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all",
                      importConflictMode === 'overwrite'
                        ? "bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                        : "bg-white/60 border-amber-200 hover:bg-white"
                    )}
                  >
                    <input
                      type="radio"
                      name="conflictMode"
                      checked={importConflictMode === 'overwrite'}
                      onChange={() => setImportConflictMode('overwrite')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-zinc-900 block text-xs">Overwrite / Update Existing</span>
                      <span className="text-[10px] text-zinc-500">Update existing member records with the new values from this spreadsheet.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Preview Table showing ALL rows */}
            {importParsedRows.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-800">
                    Spreadsheet Preview ({filteredPreviewRows.length} of {importParsedRows.length} rows)
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-medium">Showing all rows in spreadsheet</span>
                </div>

                <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white max-h-64 overflow-y-auto custom-scrollbar shadow-inner">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-100/90 sticky top-0 z-10 border-b border-zinc-200 text-zinc-600">
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase w-10">#</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase">Membership ID</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase">Email</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredPreviewRows.map((row) => (
                        <tr
                          key={row.rowNum}
                          className={cn(
                            "hover:bg-zinc-50 transition-colors",
                            row.status === 'duplicate_db' || row.status === 'duplicate_file'
                              ? "bg-amber-50/40"
                              : row.status === 'invalid'
                              ? "bg-red-50/30"
                              : ""
                          )}
                        >
                          <td className="px-3 py-2 text-zinc-400 font-mono text-[11px]">
                            {row.rowNum}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-zinc-900">
                            {row.uniqueId}
                          </td>
                          <td className="px-3 py-2 text-zinc-700">
                            {row.email}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {row.status === 'new' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <CheckCircle2 size={11} />
                                New Member
                              </span>
                            )}
                            {row.status === 'duplicate_db' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                                <AlertTriangle size={11} />
                                {row.statusLabel}
                              </span>
                            )}
                            {row.status === 'duplicate_file' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-bold">
                                <AlertTriangle size={11} />
                                Duplicate in File
                              </span>
                            )}
                            {row.status === 'invalid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold">
                                Invalid Email
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportParsedRows([]);
                }}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importFile || isImporting || importParsedRows.length === 0}
                onClick={handleImportSubmit}
                className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-black/10 cursor-pointer disabled:opacity-50"
              >
                {isImporting && <Loader2 size={14} className="animate-spin" />}
                <span>
                  {isImporting
                    ? 'Processing Spreadsheet...'
                    : importConflictMode === 'overwrite'
                    ? `Import & Overwrite (${importParsedRows.length} Members)`
                    : previewNewCount === 0 && previewTotalDuplicates > 0
                    ? `Skip ${previewTotalDuplicates} Duplicates & Finish`
                    : `Import ${previewNewCount} New Members${previewTotalDuplicates > 0 ? ` (Skip ${previewTotalDuplicates} Duplicates)` : ''}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: MEMBER DETAILS VIEW                         */}
      {/* ==================================================== */}
      {isDetailsModalOpen && selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 text-white rounded-[2.5rem] border border-white/10 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute right-6 top-6 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
                <Crown size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-mono">{selectedMember.uniqueId}</h3>
                <p className="text-xs text-zinc-400">{selectedMember.email}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                  Registered Email Address
                </span>
                <span className="text-xs font-medium text-white break-all">{selectedMember.email}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    50% Concession Pass Status
                  </span>
                  {selectedMember.hasActiveSubscription ? (
                    <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-bold uppercase">
                      Active (₹1,000 / Yr)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full text-[10px] font-bold uppercase">
                      Unsubscribed
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Enrolled on <strong className="text-white">{formatDate(selectedMember.enrolledDate)}</strong> via{' '}
                  <strong className="text-white">{selectedMember.source === 'admin_enrolled' ? 'Admin Enrollment' : 'Spreadsheet Import'}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  openEditModal(selectedMember);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: EDIT LIFE MEMBER                            */}
      {/* ==================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">Edit Member</h3>
                  <p className="text-xs text-zinc-500">Update registered email address</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Membership ID</span>
                  <span className="font-mono font-bold text-sm text-black">{editForm.uniqueId}</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase">
                  Unique Key
                </span>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Confirm Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Re-enter email address to confirm"
                  value={editForm.confirmEmail}
                  onChange={(e) => setEditForm({ ...editForm, confirmEmail: e.target.value })}
                  className={cn(
                    "w-full px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none",
                    editForm.confirmEmail && editForm.email.toLowerCase() !== editForm.confirmEmail.toLowerCase()
                      ? "border-red-300 bg-red-50/30 text-red-900"
                      : "border-zinc-200"
                  )}
                />
                {editForm.confirmEmail && editForm.email.toLowerCase() !== editForm.confirmEmail.toLowerCase() && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">Emails do not match</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-black/10 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit && <Loader2 size={14} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLifeMembers;
