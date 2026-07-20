import React from 'react';
import { Mail, MapPin } from 'lucide-react';
import logo from '../assets/logo.png';

interface GlobalFooterProps {
  showSocials?: boolean;
  showTaglines?: boolean;
}

const GlobalFooter = ({ showSocials = false, showTaglines = true }: GlobalFooterProps) => {
  return (
    <footer className="w-full bg-black text-white py-5 md:py-8 px-4 sm:px-6 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center gap-5 md:gap-8 lg:gap-6">

          {/* Left — Logo + Email + Map */}
          <div className="flex flex-col items-center md:items-start gap-2.5 text-center md:text-left">
            {/* Logo */}
            <img
              src={logo}
              alt="BKMA Logo"
              className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
            {/* Email */}
            <a
              href="mailto:keralamathsasso@gmail.com"
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors group"
            >
              <Mail size={11} className="shrink-0 group-hover:scale-110 transition-transform" />
              keralamathsasso@gmail.com
            </a>
            {/* Map */}
            <a
              href="https://maps.google.com/?q=Kerala+Mathematical+Association+Kerala+India"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors group"
            >
              <MapPin size={11} className="shrink-0 group-hover:scale-110 transition-transform" />
              Kerala, India — View on Map
            </a>

            {/* Taglines (optional) */}
            {showTaglines && (
              <div className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide leading-relaxed hover:text-zinc-200 transition-colors duration-300 space-y-1 w-full md:w-fit mt-1">
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  <span>• Connecting Researchers</span>
                  <span>• Publishing Knowledge</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>• Building Innovation</span>
                </div>
              </div>
            )}
          </div>

          {/* Copyright (Center) */}
          <div className="flex flex-col items-center justify-center text-center md:col-span-2 lg:col-span-1 order-last lg:order-none pt-4 md:pt-4 lg:pt-0 border-t border-white/5 lg:border-t-0 mt-3 md:mt-0">
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              © {new Date().getFullYear()} Kerala Mathematical Association.
            </p>
            <p className="text-[11px] text-zinc-500 font-normal tracking-wide mt-0.5">
              All Rights Reserved.
            </p>
          </div>

          {/* Developed By (Right) */}
          <div className="flex flex-col items-center gap-1.5 text-center mt-3 md:mt-0">
            <h4 className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">
              Designed And Developed By
            </h4>
            <a
              href="https://chetanbschool.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-800 hover:border-zinc-600 bg-zinc-900 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 tracking-tight transition-all duration-300 shadow-sm"
            >
              Chetan Business School <span className="text-zinc-500 font-normal">| Hubballi-580031</span>
            </a>
            <div className="flex items-center gap-2 text-[11px] tracking-wide text-zinc-400">
              <a
                href="https://nandeeshmn.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-white transition-colors"
              >
                Nandeesh MN
              </a>
              <span className="text-zinc-600 font-normal">•</span>
              <a
                href="https://shivanandvn.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-white transition-colors"
              >
                Shivanand VN
              </a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
