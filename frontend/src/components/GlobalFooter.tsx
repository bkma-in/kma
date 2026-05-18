import React from 'react';
import { Globe, Mail, Users, Info } from 'lucide-react';

interface GlobalFooterProps {
  showSocials?: boolean;
}

const GlobalFooter = ({ showSocials = false }: GlobalFooterProps) => {
  return (
    <footer className="w-full bg-black text-white py-8 px-4 sm:px-6 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center gap-8 lg:gap-6">
          {/* Brand Tagline & Social Icons (Left) */}
          <div className="flex flex-col items-center md:items-start gap-2.5 text-center md:text-left">
            <div className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide leading-relaxed hover:text-zinc-200 transition-colors duration-300 space-y-1 w-full md:w-fit">
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span>• Connecting Researchers</span>
                <span>• Publishing Knowledge</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>• Building Innovation</span>
              </div>
            </div>
            {showSocials && (
              <div className="flex justify-center md:justify-start gap-3 pt-1">
                {[
                  { Icon: Globe, url: "#" },
                  { Icon: Mail, url: "#" },
                  { Icon: Users, url: "#" },
                  { Icon: Info, url: "#" }
                ].map((social, i) => (
                  <a 
                    key={i} 
                    href={social.url} 
                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white transition-all duration-300 bg-white/5 hover:bg-black group"
                  >
                    <social.Icon size={14} className="group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Copyright (Center) */}
          <div className="flex flex-col items-center justify-center text-center md:col-span-2 lg:col-span-1 order-last lg:order-none pt-6 md:pt-4 lg:pt-0 border-t border-white/5 lg:border-t-0">
            <p className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide">
              © 2024 Kerala Mathematical Association.
            </p>
            <p className="text-xs text-zinc-500 font-normal tracking-wide mt-1">
              All Rights Reserved.
            </p>
          </div>

          {/* Developed By (Right) */}
          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <h4 className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
              Designed And Developed By
            </h4>
            <a 
              href="https://chetanbschool.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-600 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 tracking-tight transition-all duration-300 shadow-sm"
            >
              Chetan Business School <span className="text-zinc-500 font-normal">| Hubballi-580031</span>
            </a>
            <div className="flex items-center gap-2 mt-0.5 text-xs tracking-wide">
              <a 
                href="https://nandeeshmn.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Nandeesh MN
              </a>
              <span className="text-zinc-600">|</span>
              <a 
                href="https://shivanandvn.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-zinc-400 hover:text-white transition-colors"
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
