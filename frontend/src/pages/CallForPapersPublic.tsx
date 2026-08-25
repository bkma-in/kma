import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { CFPHero } from '../components/cfp/CFPHero';
import { CFPList } from '../components/cfp/CFPList';
import type { CallForPaper } from '../types/cfp';
import { getCFPs } from '../services/cfp.service';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';

export const CallForPapersPublic: React.FC = () => {
  const navigate = useNavigate();

  const [cfps, setCfps] = useState<CallForPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('published'); // Current Calls by default
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedVolume, setSelectedVolume] = useState('');

  useEffect(() => {
    // Inject SEO Metadata into document head
    document.title = 'Call for Papers | Bulletin of Kerala Mathematics Association';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Explore active, upcoming, and archived Call for Papers for the Bulletin of Kerala Mathematics Association. Submit research papers in mathematics.');
    }

    // Add JSON-LD Structured Data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'cfp-jsonld';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Periodical',
      'name': 'Bulletin of Kerala Mathematics Association',
      'publisher': {
        '@type': 'Organization',
        'name': 'Kerala Mathematics Association'
      },
      'description': 'Calls for papers for mathematical research articles.'
    });

    const existingScript = document.getElementById('cfp-jsonld');
    if (existingScript) existingScript.remove();
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('cfp-jsonld');
      if (el) el.remove();
    };
  }, []);

  const fetchCFPs = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await getCFPs();
      if (res.success) {
        setCfps(res.cfps || []);
      }
    } catch (err: any) {
      console.error('Failed to load CFPs:', err);
      setFetchError(err.response?.data?.error || err.message || 'Failed to load calls for papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCFPs();
  }, []);

  // Extract all unique topics across CFPs
  const allTopics = Array.from(
    new Set(cfps.flatMap(c => c.topics || []).filter(Boolean))
  );

  // Extract unique years & volumes
  const allYears = Array.from(
    new Set(cfps.map(c => c.deadline?.split('-')[0] || c.openingDate?.split('-')[0]).filter(Boolean))
  ).sort().reverse();

  const allVolumes = Array.from(
    new Set(cfps.map(c => c.volume).filter(Boolean))
  ).sort();

  // Filter CFPs
  const filteredCFPs = cfps.filter(c => {
    // Tab filter
    if (activeTab === 'published') {
      if (c.status !== 'published') return false;
    } else if (activeTab === 'scheduled') {
      if (c.status !== 'scheduled') return false;
    } else if (activeTab === 'closed') {
      if (c.status !== 'closed') return false;
    } else if (activeTab === 'archived') {
      if (c.status !== 'archived') return false;
    }

    // Topic filter
    if (selectedTopic && (!c.topics || !c.topics.some(t => t.toLowerCase() === selectedTopic.toLowerCase()))) {
      return false;
    }

    // Year filter
    if (selectedYear) {
      const y = c.deadline?.split('-')[0] || c.openingDate?.split('-')[0];
      if (y !== selectedYear) return false;
    }

    // Volume filter
    if (selectedVolume && String(c.volume) !== String(selectedVolume)) {
      return false;
    }

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.theme && c.theme.toLowerCase().includes(q)) ||
        (c.volume && String(c.volume).includes(q)) ||
        (c.issue && String(c.issue).includes(q))
      );
    }

    return true;
  });

  const publishedCount = cfps.filter(c => c.status === 'published').length;
  const scheduledCount = cfps.filter(c => c.status === 'scheduled').length;
  const closedCount = cfps.filter(c => c.status === 'closed').length;
  const archivedCount = cfps.filter(c => c.status === 'archived').length;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-['Outfit']">
      <PublicHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
        {/* Hero Banner */}
        <CFPHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          topics={allTopics}
          selectedTopic={selectedTopic}
          onSelectTopic={setSelectedTopic}
        />

        {/* Tab & Dropdown Filters Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
          {/* Categorized Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'published', label: `Current Calls (${publishedCount})` },
              { id: 'scheduled', label: `Upcoming Calls (${scheduledCount})` },
              { id: 'closed', label: `Closed Calls (${closedCount})` },
              { id: 'archived', label: `Archived Calls (${archivedCount})` },
              { id: 'all', label: `All Calls (${cfps.length})` }
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

          {/* Select Dropdowns */}
          <div className="flex items-center gap-3 shrink-0">
            {allYears.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 outline-none focus:ring-1 focus:ring-black cursor-pointer"
              >
                <option value="">All Years</option>
                {allYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {allVolumes.length > 0 && (
              <select
                value={selectedVolume}
                onChange={(e) => setSelectedVolume(e.target.value)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 outline-none focus:ring-1 focus:ring-black cursor-pointer"
              >
                <option value="">All Volumes</option>
                {allVolumes.map(v => (
                  <option key={v} value={v}>Volume {v}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* List of Call for Papers Cards */}
        {fetchError && cfps.length === 0 && !loading ? (
          <div className="bg-white border border-rose-200 rounded-3xl p-10 text-center space-y-4 shadow-sm max-w-xl mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Unable to Load Calls for Papers</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">{fetchError}</p>
            <button
              onClick={fetchCFPs}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw size={14} />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : (
          <CFPList
            cfps={filteredCFPs}
            loading={loading}
            onReadMore={(cfp) => navigate(`/call-for-papers/${cfp.id}`)}
          />
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default CallForPapersPublic;
