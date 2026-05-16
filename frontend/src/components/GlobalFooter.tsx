import React from 'react';
import { Globe, Mail, Users, Info } from 'lucide-react';

interface GlobalFooterProps {
  showSocials?: boolean;
}

const GlobalFooter = ({ showSocials = false }: GlobalFooterProps) => {
  return (
    <footer className="bg-black text-white py-8 px-6 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
          {/* Social Icons (Left) */}
          <div className="flex justify-center md:justify-start gap-3">
            {showSocials && [
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

          {/* Copyright (Center) */}
          <div className="text-center">
            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-[0.1em]">
              © 2024 KERALA MATHEMATICAL ASSOCIATION. ALL RIGHTS RESERVED.
            </p>
          </div>

          {/* Developed By (Right) */}
          <div className="flex flex-col items-center md:items-end gap-1 text-center md:text-right">
            <h4 className="text-[10px] font-medium text-zinc-400">Designed And Developed By</h4>
            <a 
              href="https://chetanbschool.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-1.5 my-1 rounded-full border border-zinc-800 hover:border-zinc-600 bg-zinc-900 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 tracking-tight transition-all duration-300 translate-x-2 md:translate-x-4"
            >
              Chetan Business School | Hubballi-580031
            </a>
            <div className="flex items-center gap-2">
              <a 
                href="https://nandeeshmn.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Nandeesh MN
              </a>
              <span className="text-zinc-600">|</span>
              <a 
                href="https://shivanandvn.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
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
