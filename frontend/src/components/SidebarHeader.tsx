import React from 'react';

interface SidebarHeaderProps {
  portalName: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ portalName }) => {
  return (
    <div className="p-8 flex flex-col items-center border-b border-zinc-800/50">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tighter text-white leading-none">KMA</h1>
        <p className="text-[10px] text-zinc-300 font-bold tracking-[0.2em] mt-2 uppercase">{portalName}</p>
      </div>
    </div>
  );
};

export default SidebarHeader;
