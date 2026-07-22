import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const ServiceDescription: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white flex flex-col">
      <PublicHeader />

      <main className="flex-1 pt-28 sm:pt-32 pb-20">

        {/* Hero Banner */}
        <section className="bg-black text-white py-8 sm:py-10 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl -ml-48 -mb-48" />
          <div className="max-w-7xl mx-auto text-center relative z-10 space-y-2.5">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Playfair_Display']">
              Service Description
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Overview of publications, subscriptions, memberships, and related scholarly services
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Service Description</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Overview</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              The <strong className="text-black">Bulletin of Kerala Mathematical Association (BKMA)</strong> is an academic publication platform dedicated to promoting mathematical research, scholarly communication, and knowledge sharing among researchers, educators, students, and institutions.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              BKMA provides access to academic publications, subscription services, memberships, and related scholarly resources through its digital platform.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-8 leading-tight">Services Offered</h2>
            <div className="space-y-10">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-black mb-3">Journal Subscriptions</h3>
                <p className="text-zinc-700 text-base sm:text-lg leading-relaxed mb-4">
                  Subscribers receive access to BKMA publications and journal issues according to the selected subscription plan.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-600 text-base sm:text-lg">
                  <li>Access to published research articles</li>
                  <li>Academic and scholarly content</li>
                  <li>Current and archived journal issues</li>
                  <li>Institution and individual subscription options</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-black mb-3">Reader Access Services</h3>
                <p className="text-zinc-700 text-base sm:text-lg leading-relaxed mb-4">
                  Registered readers gain access to custom dashboard tools designed to simplify research browsing and archiving.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-600 text-base sm:text-lg">
                  <li>Browse published articles &amp; abstracts</li>
                  <li>Access subscribed premium content</li>
                  <li>Manage subscriptions &amp; payment profiles</li>
                  <li>Save articles for future reference</li>
                  <li>Receive email notifications for new releases</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-black mb-3">Membership Services</h3>
                <p className="text-zinc-700 text-base sm:text-lg leading-relaxed mb-4">
                  BKMA offers membership opportunities for individuals interested in supporting and participating in the mathematical community.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-600 text-base sm:text-lg">
                  <li>Reduced subscription charges (where applicable)</li>
                  <li>Access to selected member resources</li>
                  <li>Participation in academic activities and initiatives</li>
                  <li>Updates regarding BKMA events and publications</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-black mb-3">Author Services</h3>
                <p className="text-zinc-700 text-base sm:text-lg leading-relaxed mb-4">
                  Authors are equipped with digital submission tools to guide them through the manuscript lifecycle.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-600 text-base sm:text-lg">
                  <li>Submit research manuscripts online</li>
                  <li>Track manuscript evaluation status</li>
                  <li>Receive consolidated reviewer feedback</li>
                  <li>Submit revised papers and corrections</li>
                  <li>Monitor publication progress and timelines</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Peer Review Services</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              BKMA facilitates an academic peer-review process where submitted manuscripts are evaluated by qualified reviewers before publication to guarantee scientific rigour.
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4">Review Stages</p>
            <ol className="list-decimal pl-6 space-y-3.5 text-zinc-600 text-base sm:text-lg leading-relaxed">
              <li>Initial Editorial Screening</li>
              <li>Reviewer Assignment</li>
              <li>Revision Requests</li>
              <li>Final Editorial Decision</li>
            </ol>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Service Activation</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-4">
              For digital subscriptions and memberships, access is generally activated after successful payment confirmation and account verification.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Activation timelines may vary depending on the selected service and administrative review requirements.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Delivery of Services</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-4">
              BKMA primarily provides digital services through its online platform.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Where physical journal distribution is applicable, delivery timelines may vary depending on location, postal services, and publication schedules.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Contact Information</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              For questions regarding subscriptions, memberships, payments, publications, or platform services, users may contact BKMA through the official communication channels available on the website.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ServiceDescription;
