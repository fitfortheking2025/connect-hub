"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { UserCircle2, X, Shield, KeyRound, LogOut } from "lucide-react";
import LogoutButton from "@/app/components/LogoutButton";
import ChangePasswordModal from "@/app/components/ChangePasswordModal";

interface MobileUserDrawerProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
  };
  isAdmin?: boolean;
}

export default function MobileUserDrawer({ user, isAdmin }: MobileUserDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user.name || user.email || "Minister";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Header Avatar Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-orange-50/80 border border-orange-200/60 active:scale-95 transition-all"
        title="Open Profile Menu"
      >
        <div className="w-7 h-7 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-xs shadow-sm">
          {initials}
        </div>
      </button>

      {/* Slide-up Account Sheet / Modal */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] border border-slate-200 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Account Details
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Identity Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-base shadow-md shadow-orange-500/20 shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm text-[#111827] truncate">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-100/80 text-[#FF6B00] text-[10px] font-black uppercase">
                      <Shield className="w-2.5 h-2.5" />
                      {isAdmin ? "Admin" : user.role || "Follow-Up Team"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                    <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <span>Change Password</span>
                  </div>
                  <ChangePasswordModal />
                </div>

                <div className="w-full">
                  <LogoutButton className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs transition-colors border border-rose-200/60" />
                </div>
              </div>

            </div>
          </div>,
          document.body
        )}
    </>
  );
}