import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Megaphone } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { CFPDetails } from '../components/cfp/CFPDetails';
import { SkeletonCFPDetails } from '../components/skeletons/SkeletonCFPDetails';
import type { CallForPaper } from '../types/cfp';
import { getCFPById } from '../services/cfp.service';

export const CallForPaperDetailsPublic: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cfp, setCfp] = useState<CallForPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCFP = async () => {
      try {
        const res = await getCFPById(id);
        if (res.success && res.cfp) {
          setCfp(res.cfp);
          // Set page title & Meta tags
          document.title = `${res.cfp.title} | BKMA Call for Papers`;

          // Inject OpenGraph Meta Tags dynamically
          let ogTitle = document.querySelector('meta[property="og:title"]');
          if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
          }
          ogTitle.setAttribute('content', res.cfp.title);

          let ogDesc = document.querySelector('meta[property="og:description"]');
          if (!ogDesc) {
            ogDesc = document.createElement('meta');
            ogDesc.setAttribute('property', 'og:description');
            document.head.appendChild(ogDesc);
          }
          ogDesc.setAttribute('content', res.cfp.subtitle || `Submission deadline: ${res.cfp.deadline}`);

          // Inject JSON-LD Schema
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.id = 'cfp-details-jsonld';
          script.text = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            'name': res.cfp.title,
            'startDate': res.cfp.openingDate,
            'endDate': res.cfp.deadline,
            'eventStatus': 'https://schema.org/EventScheduled',
            'organizer': {
              '@type': 'Organization',
              'name': 'Kerala Mathematics Association',
              'url': 'https://www.bkma.in'
            },
            'description': res.cfp.description
          });

          const existingScript = document.getElementById('cfp-details-jsonld');
          if (existingScript) existingScript.remove();
          document.head.appendChild(script);
        }
      } catch (err: any) {
        console.error('Failed to load CFP details:', err);
        setError(err.response?.data?.error || 'Call for Papers not found');
      } finally {
        setLoading(false);
      }
    };

    fetchCFP();

    return () => {
      const el = document.getElementById('cfp-details-jsonld');
      if (el) el.remove();
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-['Outfit']">
      <PublicHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/call-for-papers"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-black transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={16} />
            <span>Back to All Calls</span>
          </Link>
        </div>

        {loading ? (
          <SkeletonCFPDetails />
        ) : error || !cfp ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <Megaphone size={40} className="mx-auto text-zinc-400" />
            <h2 className="text-xl font-bold text-black">{error || 'Call for Papers Not Found'}</h2>
            <p className="text-xs text-zinc-500">The requested Call for Papers may have been removed or is no longer available.</p>
            <Link
              to="/call-for-papers"
              className="inline-block px-5 py-2.5 bg-black text-white text-xs font-black rounded-xl uppercase tracking-wider"
            >
              Browse Active Calls
            </Link>
          </div>
        ) : (
          <CFPDetails cfp={cfp} />
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default CallForPaperDetailsPublic;
