import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  FileEdit, 
  Trash2, 
  Copy, 
  Send, 
  Eye, 
  Archive, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  FileText,
  Filter,
  Loader2,
  Mail,
  X,
  Calendar,
  Layers,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDateDDMMYYYY } from '../../utils/dateHelpers';
import { CustomDateInput } from '../../components/common/CustomDateInput';
import type { CallForPaper, CFPStatus } from '../../types/cfp';
import { 
  getCFPs, 
  createCFP, 
  updateCFP, 
  unpublishCFP, 
  archiveCFP, 
  duplicateCFP, 
  deleteCFP 
} from '../../services/cfp.service';
import { CFPStatusBadge } from '../../components/cfp/CFPStatusBadge';
import { DeadlineBadge } from '../../components/cfp/DeadlineBadge';
import { PublishCFPModal } from '../../components/cfp/PublishCFPModal';
import { CFPEmailQueueManager } from '../../components/cfp/CFPEmailQueueManager';
import { useNotification } from '../../utils/NotificationContext';
import { useNavigate } from 'react-router-dom';

const AdminCallForPapers = () => {
  const navigate = useNavigate();
  const { showToast, confirm } = useNotification();

  const [cfps, setCfps] = useState<CallForPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCfp, setEditingCfp] = useState<CallForPaper | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedForPublish, setSelectedForPublish] = useState<CallForPaper | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    theme: '',
    volume: '1',
    issue: '1',
    openingDate: new Date().toISOString().split('T')[0],
    deadline: '',
    publicationDate: '',
    eligibility: '',
    topicsInput: '',
    authorGuidelines: '',
    paperFormatRequirements: '',
    reviewProcess: '',
    importantDatesJson: '',
    contactEmail: 'ktmsamuelms@gmail.com',
    contactPhone: ''
  });

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const fetchCFPs = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await getCFPs({ status: activeTab !== 'all' && activeTab !== 'queue' ? activeTab : undefined });
      if (res.success) {
        setCfps(res.cfps || []);
      }
    } catch (err: any) {
      console.error('Failed to load CFPs:', err);
      const msg = err.response?.data?.error || err.message || 'Unable to connect to server. It may be waking up.';
      setFetchError(msg);
      showToast('Failed to load Calls for Papers. Please retry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCFPs();
  }, [activeTab]);

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      theme: '',
      volume: '1',
      issue: '1',
      openingDate: new Date().toISOString().split('T')[0],
      deadline: '',
      publicationDate: '',
      eligibility: '',
      topicsInput: '',
      authorGuidelines: '',
      paperFormatRequirements: '',
      reviewProcess: '',
      importantDatesJson: '',
      contactEmail: 'ktmsamuelms@gmail.com',
      contactPhone: ''
    });
    setBannerFile(null);
    setAttachmentFile(null);
    setEditingCfp(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cfp: CallForPaper) => {
    setEditingCfp(cfp);
    setFormData({
      title: cfp.title || '',
      subtitle: cfp.subtitle || '',
      description: cfp.description || '',
      theme: cfp.theme || '',
      volume: cfp.volume || '1',
      issue: cfp.issue || '1',
      openingDate: cfp.openingDate || '',
      deadline: cfp.deadline || '',
      publicationDate: cfp.publicationDate || '',
      eligibility: cfp.eligibility || '',
      topicsInput: Array.isArray(cfp.topics) ? cfp.topics.join(', ') : '',
      authorGuidelines: cfp.authorGuidelines || '',
      paperFormatRequirements: cfp.paperFormatRequirements || '',
      reviewProcess: cfp.reviewProcess || '',
      importantDatesJson: cfp.importantDates ? JSON.stringify(cfp.importantDates, null, 2) : '',
      contactEmail: cfp.contactEmail || 'ktmsamuelms@gmail.com',
      contactPhone: cfp.contactPhone || ''
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline) {
      showToast('Title and Deadline are required fields.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('subtitle', formData.subtitle);
      payload.append('description', formData.description);
      payload.append('theme', formData.theme);
      payload.append('volume', formData.volume);
      payload.append('issue', formData.issue);
      payload.append('openingDate', formData.openingDate);
      payload.append('deadline', formData.deadline);
      payload.append('publicationDate', formData.publicationDate);
      payload.append('eligibility', formData.eligibility);
      payload.append('authorGuidelines', formData.authorGuidelines);
      payload.append('paperFormatRequirements', formData.paperFormatRequirements);
      payload.append('reviewProcess', formData.reviewProcess);
      payload.append('contactEmail', formData.contactEmail);
      payload.append('contactPhone', formData.contactPhone);

      // Parse topics
      const topicsArr = formData.topicsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      payload.append('topics', JSON.stringify(topicsArr));

      // Parse important dates JSON or default
      if (formData.importantDatesJson) {
        try {
          const parsed = JSON.parse(formData.importantDatesJson);
          payload.append('importantDates', JSON.stringify(parsed));
        } catch {
          payload.append('importantDates', JSON.stringify([]));
        }
      }

      if (bannerFile) payload.append('banner', bannerFile);
      if (attachmentFile) payload.append('attachment', attachmentFile);

      let res;
      if (editingCfp) {
        res = await updateCFP(editingCfp.id, payload);
        if (res.success) showToast('Call for Papers updated successfully.', 'success');
      } else {
        res = await createCFP(payload);
        if (res.success) showToast('Call for Papers created as draft.', 'success');
      }

      if (res.success) {
        setIsFormModalOpen(false);
        resetForm();
        await fetchCFPs();
      }
    } catch (err: any) {
      console.error('Save CFP failed:', err);
      showToast(err.response?.data?.error || 'Failed to save Call for Papers', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPublish = (cfp: CallForPaper) => {
    setSelectedForPublish(cfp);
    setIsPublishModalOpen(true);
  };

  const handleUnpublish = (id: string) => {
    confirm({
      title: 'Unpublish Call for Papers',
      message: 'Are you sure you want to unpublish this Call for Papers? It will revert to draft status.',
      confirmText: 'Unpublish',
      onConfirm: async () => {
        try {
          const res = await unpublishCFP(id);
          if (res.success) {
            showToast('CFP unpublished', 'info');
            await fetchCFPs();
          }
        } catch (err) {
          showToast('Failed to unpublish CFP', 'error');
        }
      }
    });
  };

  const handleArchive = (id: string) => {
    confirm({
      title: 'Archive Call for Papers',
      message: 'Are you sure you want to archive this Call for Papers?',
      confirmText: 'Archive',
      onConfirm: async () => {
        try {
          const res = await archiveCFP(id);
          if (res.success) {
            showToast('CFP archived successfully', 'success');
            await fetchCFPs();
          }
        } catch (err) {
          showToast('Failed to archive CFP', 'error');
        }
      }
    });
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await duplicateCFP(id);
      if (res.success) {
        showToast('Duplicated CFP created as new draft', 'success');
        await fetchCFPs();
      }
    } catch (err) {
      showToast('Failed to duplicate CFP', 'error');
    }
  };

  const handleDeleteDraft = (id: string) => {
    confirm({
      title: 'Delete Draft CFP',
      message: 'Are you sure you want to permanently delete this draft Call for Papers?',
      confirmText: 'Delete Draft',
      onConfirm: async () => {
        try {
          const res = await deleteCFP(id);
          if (res.success) {
            showToast('Draft deleted', 'info');
            await fetchCFPs();
          }
        } catch (err: any) {
          showToast(err.response?.data?.error || 'Failed to delete draft', 'error');
        }
      }
    });
  };

  // Filter CFPs for active tab & search
  const filteredCFPs = cfps.filter(c => {
    if (activeTab !== 'all' && activeTab !== 'queue') {
      if (c.status.toLowerCase() !== activeTab.toLowerCase()) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.volume && String(c.volume).includes(q)) ||
        (c.issue && String(c.issue).includes(q)) ||
        (c.theme && c.theme.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = cfps.filter(c => c.status === 'published').length;
  const draftCount = cfps.filter(c => c.status === 'draft').length;
  const scheduledCount = cfps.filter(c => c.status === 'scheduled').length;
  const closedCount = cfps.filter(c => c.status === 'closed').length;
  const archivedCount = cfps.filter(c => c.status === 'archived').length;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight font-['Outfit'] flex items-center gap-3">
            <Megaphone size={28} />
            <span>Call for Papers Manager</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Create, publish, schedule, and monitor Call for Papers campaigns and email queue delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCFPs}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Calls for Papers"
          >
            <RefreshCw size={15} className={cn(loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black text-white font-black text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Call for Papers</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Calls</p>
          <p className="text-2xl font-black text-emerald-600 font-['Outfit']">{activeCount}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Drafts</p>
          <p className="text-2xl font-black text-zinc-700 font-['Outfit']">{draftCount}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Scheduled</p>
          <p className="text-2xl font-black text-blue-600 font-['Outfit']">{scheduledCount}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Closed</p>
          <p className="text-2xl font-black text-zinc-500 font-['Outfit']">{closedCount}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Archived</p>
          <p className="text-2xl font-black text-amber-600 font-['Outfit']">{archivedCount}</p>
        </div>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
          {[
            { id: 'all', label: `All (${cfps.length})` },
            { id: 'published', label: `Active (${activeCount})` },
            { id: 'draft', label: `Drafts (${draftCount})` },
            { id: 'scheduled', label: `Scheduled (${scheduledCount})` },
            { id: 'closed', label: `Closed (${closedCount})` },
            { id: 'archived', label: `Archived (${archivedCount})` },
            { id: 'queue', label: 'Email Queue Monitoring' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-black text-white shadow-md"
                  : "text-zinc-600 hover:text-black hover:bg-zinc-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'queue' && (
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calls..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-black outline-none"
            />
          </div>
        )}
      </div>

      {/* Tab Content Rendering */}
      {activeTab === 'queue' ? (
        <CFPEmailQueueManager />
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-500">
              <Loader2 size={24} className="animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading Call for Papers...</p>
            </div>
          ) : fetchError && cfps.length === 0 ? (
            <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Failed to Load Calls for Papers</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">{fetchError}</p>
              <button
                onClick={fetchCFPs}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
              >
                <RefreshCw size={14} />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : filteredCFPs.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
              <Megaphone size={36} className="mx-auto mb-3 text-zinc-400" />
              <h3 className="text-base font-bold text-black">No Call for Papers Found</h3>
              <p className="text-xs text-zinc-500 mt-1">There are no calls matching your selected tab or search query.</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Title & Issue</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Opening Date</th>
                      <th className="py-3 px-4">Deadline</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {filteredCFPs.map(cfp => (
                      <tr key={cfp.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 px-4 max-w-md">
                          <div className="space-y-1">
                            <span className="font-bold text-black hover:underline cursor-pointer block line-clamp-1" onClick={() => navigate(`/call-for-papers/${cfp.id}`)}>
                              {cfp.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                              <span>Vol {cfp.volume} • Issue {cfp.issue}</span>
                              {cfp.theme && (
                                <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                                  {cfp.theme}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <CFPStatusBadge status={cfp.status} />
                        </td>

                        <td className="py-4 px-4 text-xs font-mono text-zinc-600">
                          {formatDateDDMMYYYY(cfp.openingDate)}
                        </td>

                        <td className="py-4 px-4">
                          <DeadlineBadge deadline={cfp.deadline} />
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/call-for-papers/${cfp.id}`)}
                              title="View Public Page"
                              className="p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(cfp)}
                              title="Edit CFP"
                              className="p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileEdit size={16} />
                            </button>

                            <button
                              onClick={() => handleDuplicate(cfp.id)}
                              title="Duplicate CFP"
                              className="p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Copy size={16} />
                            </button>

                            {cfp.status !== 'published' ? (
                              <button
                                onClick={() => handleOpenPublish(cfp)}
                                title="Publish CFP"
                                className="px-3 py-1.5 bg-black text-white hover:bg-zinc-800 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Send size={13} />
                                <span>Publish</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnpublish(cfp.id)}
                                title="Unpublish CFP"
                                className="px-3 py-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Unpublish
                              </button>
                            )}

                            {cfp.status !== 'archived' && (
                              <button
                                onClick={() => handleArchive(cfp.id)}
                                title="Archive CFP"
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Archive size={16} />
                              </button>
                            )}

                            {cfp.status === 'draft' && (
                              <button
                                onClick={() => handleDeleteDraft(cfp.id)}
                                title="Delete Draft"
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit CFP Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-white rounded-3xl max-w-4xl lg:max-w-5xl w-full max-h-[85vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-zinc-200/80 relative overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed) */}
            <div className="flex items-center justify-between px-6 py-4 sm:px-8 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black font-['Outfit']">
                    {editingCfp ? 'Edit Call for Papers' : 'Create Call for Papers'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">Define issue details, deadlines, and submission guidelines</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)} 
                className="text-zinc-400 hover:text-black p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable with min-h-0) */}
            <form id="cfp-modal-form" onSubmit={handleFormSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Section 1: Call Details */}
              <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-3">
                  <FileText size={16} className="text-black" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-black font-['Outfit']">1. Journal Issue & Title</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Call for Papers: Special Issue on Mathematical Physics"
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Subtitle (Optional)</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="e.g. Volume 2026, Issue 2"
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Volume *</label>
                    <input
                      type="text"
                      required
                      value={formData.volume}
                      onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                      placeholder="e.g. 21"
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Issue *</label>
                    <input
                      type="text"
                      required
                      value={formData.issue}
                      onChange={(e) => setFormData(prev => ({ ...prev, issue: e.target.value }))}
                      placeholder="e.g. 1"
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Theme / Special Issue (Optional)</label>
                    <input
                      type="text"
                      value={formData.theme}
                      onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                      placeholder="e.g. Applied Topology & Differential Equations"
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Important Schedule & Deadlines */}
              <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-3">
                  <Calendar size={16} className="text-black" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-black font-['Outfit']">2. Milestone Dates</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Opening Date *</label>
                    <CustomDateInput
                      required
                      value={formData.openingDate}
                      onChange={(val) => setFormData(prev => ({ ...prev, openingDate: val }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Deadline *</label>
                    <CustomDateInput
                      required
                      value={formData.deadline}
                      onChange={(val) => setFormData(prev => ({ ...prev, deadline: val }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Expected Publication</label>
                    <CustomDateInput
                      value={formData.publicationDate}
                      onChange={(val) => setFormData(prev => ({ ...prev, publicationDate: val }))}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Scope, Guidelines & File Attachments */}
              <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-3">
                  <Layers size={16} className="text-black" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-black font-['Outfit']">3. Topics, Scope & Attachments</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Topics Covered (Comma separated)</label>
                    <input
                      type="text"
                      value={formData.topicsInput}
                      onChange={(e) => setFormData(prev => ({ ...prev, topicsInput: e.target.value }))}
                      placeholder="e.g. Algebra, Functional Analysis, Differential Equations, Fluid Dynamics"
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Description (Scope & Objectives)</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the scope, objectives, and research domains invited..."
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all resize-y"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Author Guidelines</label>
                    <textarea
                      rows={2}
                      value={formData.authorGuidelines}
                      onChange={(e) => setFormData(prev => ({ ...prev, authorGuidelines: e.target.value }))}
                      placeholder="Provide specific instructions for authors..."
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Contact Phone</label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="+91..."
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Banner Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-200 file:text-black hover:file:bg-zinc-300 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Guidelines PDF Attachment</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-200 file:text-black hover:file:bg-zinc-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer (Fixed) */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 sm:px-8 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-black hover:bg-zinc-200/60 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="cfp-modal-form"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-black text-white hover:bg-zinc-800 transition-all shadow-md cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Call for Papers</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      <PublishCFPModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        cfp={selectedForPublish}
        onSuccess={() => {
          showToast('Call for Papers published successfully.', 'success');
          fetchCFPs();
        }}
      />
    </div>
  );
};

export default AdminCallForPapers;
