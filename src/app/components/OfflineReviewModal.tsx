// src/app/components/OfflineReviewModal.tsx
"use client";

import { useState } from "react";
import { X, Trash2, Edit3, Save, Clock, User, Phone, Check } from "lucide-react";
import { OfflineVipRecord } from "@/lib/offlineDb";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pendingList: OfflineVipRecord[];
  onUpdateRecord: (updated: OfflineVipRecord) => Promise<void>;
  onDeleteRecord: (clientTempId: string) => Promise<void>;
}

export default function OfflineReviewModal({
  isOpen,
  onClose,
  pendingList,
  onUpdateRecord,
  onDeleteRecord,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OfflineVipRecord | null>(null);

  if (!isOpen) return null;

  const startEdit = (rec: OfflineVipRecord) => {
    setEditingId(rec.clientTempId);
    setEditForm({ ...rec });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    await onUpdateRecord(editForm);
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-[#111827]">Pending Offline Cards</h3>
            <p className="text-xs text-slate-400 font-medium">
              Saved locally on this device ({pendingList.length} card{pendingList.length === 1 ? "" : "s"})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {pendingList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Check className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">All offline records are synced!</p>
              <p className="text-xs text-slate-400">There are no pending cards stored on this device.</p>
            </div>
          ) : (
            pendingList.map((item) => {
              const isEditing = editingId === item.clientTempId && editForm;

              if (isEditing) {
                return (
                  <div
                    key={item.clientTempId}
                    className="p-4 rounded-2xl border-2 border-orange-200 bg-orange-50/30 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#FF6B00]">
                      <span>Editing First Timer</span>
                      <span className="font-mono text-[10px] text-slate-400">{item.clientTempId.slice(0, 8)}</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Age</label>
                          <input
                            type="number"
                            value={editForm.age}
                            onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Contact No.</label>
                          <input
                            type="text"
                            value={editForm.contact}
                            onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Service</label>
                          <select
                            value={editForm.serviceAttended}
                            onChange={(e) => setEditForm({ ...editForm, serviceAttended: e.target.value })}
                            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                          >
                            <option value="10AM">10AM</option>
                            <option value="1PM">1PM</option>
                            <option value="4PM">4PM</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Approached By</label>
                          <input
                            type="text"
                            value={editForm.approachedBy}
                            onChange={(e) => setEditForm({ ...editForm, approachedBy: e.target.value })}
                            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-1.5 rounded-xl bg-[#FF6B00] text-white text-xs font-black shadow-md shadow-orange-500/20 hover:bg-[#e05e00] flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.clientTempId}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#111827] truncate">{item.fullName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-[#FF6B00]">
                        {item.serviceAttended}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.gender === 1 ? "Male" : "Female"}, {item.age} yrs
                      </span>
                      {item.contact && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {item.contact}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3" />
                      Approached by: <strong className="text-slate-600 font-semibold">{item.approachedBy}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#FF6B00] hover:bg-orange-50 transition-colors"
                      title="Edit this entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(item.clientTempId)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete duplicate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>Entries sync automatically once reconnected.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}