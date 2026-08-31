"use client";

import { useState, useEffect, useRef } from "react";
import { Search, UserCheck, X, Check, Loader2 } from "lucide-react";

interface TeamMemberItem {
  _id: string;
  name: string;
}

interface ApproachedByAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export default function ApproachedByAutocomplete({
  value,
  onChange,
  required = true,
}: ApproachedByAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<TeamMemberItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live fetch only when searchTerm is NOT empty
  useEffect(() => {
    const query = searchTerm.trim();

    if (!query) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/team/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const members = data.members || [];
        setSuggestions(members);
        setIsOpen(members.length > 0);
      } catch (err) {
        console.error("Failed to load team members", err);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (member: TeamMemberItem) => {
    onChange(member.name);
    setSearchTerm("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSearchTerm("");
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="relative space-y-1.5" ref={dropdownRef}>
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
        <span>
          Approached By (Connect Minister) {required && <span className="text-[#FF6B00]">*</span>}
        </span>
        {value && (
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <Check className="w-3 h-3" /> Selected
          </span>
        )}
      </label>

      {/* Hidden input for form submission & validation */}
      <input type="hidden" name="approachedBy" value={value} required={required} />

      {value ? (
        /* Selected Single-Pill State */
        <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-orange-50 border-2 border-[#FF6B00] text-slate-800 shadow-sm transition-all animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-[#FF6B00] text-white">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#111827]">{value}</div>
              <div className="text-[10px] font-semibold text-[#FF6B00]">Connect Member</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Remove selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Search Textbox */
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type approacher or leader name..."
            required={required}
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-[#FF6B00] animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </div>
      )}

      {/* Dynamic Dropdown: ONLY renders when user has typed and results exist */}
      {isOpen && !value && searchTerm.trim() !== "" && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-200/60 max-h-56 overflow-y-auto z-50 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
          {suggestions.map((member) => (
            <button
              key={member._id}
              type="button"
              onClick={() => handleSelect(member)}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-orange-50/60 transition-colors group"
            >
              <div>
                <div className="text-sm font-bold text-[#111827] group-hover:text-[#FF6B00] transition-colors">
                  {member.name}
                </div>
              </div>
              <span className="text-xs font-bold text-[#FF6B00] opacity-0 group-hover:opacity-100 transition-opacity">
                Select →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}