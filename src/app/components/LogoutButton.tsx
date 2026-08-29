"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { signOut } from "next-auth/react";
import { LogOut, AlertTriangle, Loader2, X } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}

export default function LogoutButton({
  className = "",
  showText = true,
}: LogoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full text-left"
        }
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
        {showText && <span>Logout</span>}
      </button>

      {/* Confirmation Modal */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-[28px] border border-slate-200/80 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-center">
              
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#111827]">Confirm Logout</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Are you sure you want to sign out of the Connect Hub portal?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleLogout}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Yes, Logout"
                  )}
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}
    </>
  );
}