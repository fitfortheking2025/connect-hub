// src/app/components/OfflineSyncBadge.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  WifiOff, 
  RotateCw, 
  CheckCircle2, 
  Layers
} from "lucide-react";
import { 
  getPendingVips, 
  removePendingVipsBatch, 
  updatePendingVip, 
  removePendingVip, 
  OfflineVipRecord 
} from "@/lib/offlineDb";
import { syncOfflineVipsBatchAction } from "@/app/actions/firstTimerAction";
import OfflineReviewModal from "./OfflineReviewModal";

interface Props {
  refreshTrigger?: number; // increments when a new offline item is added in the form
}

export default function OfflineSyncBadge({ refreshTrigger }: Props) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingList, setPendingList] = useState<OfflineVipRecord[]>([]);
  const [isSyncing, startSyncTransition] = useTransition();
  const [justSyncedCount, setJustSyncedCount] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load pending list from IndexedDB
  const refreshQueue = async () => {
    try {
      const records = await getPendingVips();
      setPendingList(records);
    } catch {
      // IndexedDB fallback
    }
  };

  // Perform synchronization
  const triggerSync = () => {
    if (!navigator.onLine || isSyncing) return;

    startSyncTransition(async () => {
      const records = await getPendingVips();
      if (records.length === 0) return;

      const res = await syncOfflineVipsBatchAction(records);
      if (res.success && res.syncedIds && res.syncedIds.length > 0) {
        await removePendingVipsBatch(res.syncedIds);
        const count = res.syncedIds.length;
        setJustSyncedCount(count);
        await refreshQueue();

        // Hide success banner after 3.5 seconds
        setTimeout(() => {
          setJustSyncedCount(null);
        }, 3500);
      }
    });
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshQueue();

    const handleOnline = () => {
      setIsOnline(true);
      // Automatically trigger sync when network is restored
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    refreshQueue();
  }, [refreshTrigger]);

  const handleUpdateRecord = async (updated: OfflineVipRecord) => {
    await updatePendingVip(updated);
    await refreshQueue();
  };

  const handleDeleteRecord = async (clientTempId: string) => {
    await removePendingVip(clientTempId);
    await refreshQueue();
  };

  // 1. Success feedback when sync completes
  if (justSyncedCount !== null) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-sm animate-in fade-in duration-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>All {justSyncedCount} card{justSyncedCount === 1 ? "" : "s"} synced!</span>
      </div>
    );
  }

  // 2. No pending items and online -> Keep header clean
  if (pendingList.length === 0 && isOnline) {
    return null;
  }

  // 3. Device is offline
  if (!isOnline) {
    return (
      <>
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors shadow-sm"
          >
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Offline</span>
            {pendingList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-300 text-slate-800 text-[10px] font-black">
                {pendingList.length}
              </span>
            )}
          </button>
          {pendingList.length > 0 && (
            <button
              disabled
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 cursor-not-allowed opacity-60"
            >
              Sync Now
            </button>
          )}
        </div>

        <OfflineReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pendingList={pendingList}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      </>
    );
  }

  // 4. Online with items waiting to sync
  return (
    <>
      <div className="inline-flex items-center gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold shadow-sm hover:bg-amber-100 transition-colors"
          title="Click to review or edit pending cards"
        >
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>{pendingList.length} saved</span>
        </button>

        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-extrabold shadow-sm shadow-orange-500/20 disabled:opacity-50 transition-all active:scale-95"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
        </button>
      </div>

      <OfflineReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pendingList={pendingList}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={handleDeleteRecord}
      />
    </>
  );
}