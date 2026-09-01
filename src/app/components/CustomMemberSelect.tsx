// src/app/components/CustomMemberSelect.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, User } from "lucide-react";

interface MemberItem {
  _id: string;
  name: string;
}

interface CustomMemberSelectProps {
  teamMembers: MemberItem[];
  selectedName: string;
  onSelect: (name: string) => void;
  placeholder?: string;
}

export default function CustomMemberSelect({
  teamMembers,
  selectedName,
  onSelect,
  placeholder = "Choose from Team Roster...",
}: CustomMemberSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMember = teamMembers.find((m) => m.name === selectedName);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-left text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF6B00] shadow-sm hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          {selectedMember ? (
            <span className="truncate">{selectedMember.name}</span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No member found
              </div>
            ) : (
              filtered.map((m) => {
                const isSelected = m.name === selectedName;
                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => {
                      onSelect(m.name);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
                      isSelected
                        ? "bg-orange-50 text-[#FF6B00]"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{m.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}