// src/app/connect-member/[code]/MemberSelfEditForm.tsx
"use client";

import { useState, useTransition } from "react";
import { updateMemberSelfAction } from "@/app/actions/memberSelfAction";
import { CheckCircle2, Loader2, Award, User, BookOpen, Lock } from "lucide-react";

const DISCIPLESHIP_CLASSES = [
  "One2One",
  "Spiritual Family Class",
  "Riverweekend / Renewed",
  "Making Disciples",
  "Empowering Leaders",
  "Prophetic & Supernatural Level 1",
];

export default function MemberSelfEditForm({ member }: { member: any }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(member.name || "");
  const nickname = member.nickname || "";
  const [gender, setGender] = useState<"Male" | "Female">(member.gender || "Male");
  const [birthdate, setBirthdate] = useState(
    member.birthdate ? new Date(member.birthdate).toISOString().split("T")[0] : ""
  );
  const [contactNumber, setContactNumber] = useState(
    member.contactNumber || member.contact || ""
  );
  const [email, setEmail] = useState(member.email || "");
  const [socialMedia, setSocialMedia] = useState(member.socialMedia || "");
  const [discipler, setDiscipler] = useState(member.discipler || "");
  const [disciples, setDisciples] = useState((member.disciples || []).join("\n"));
  const [classes, setClasses] = useState<string[]>(member.discipleshipClasses || []);
  const [isPartOfOutreach, setIsPartOfOutreach] = useState(member.isPartOfOutreach || false);

  const toggleClass = (cls: string) => {
    setClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const disciplesArray = disciples
      .split("\n")
      .map((d: any) => d.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await updateMemberSelfAction({
        code: member.updateCode,
        name,
        nickname,
        gender,
        birthdate: birthdate || undefined,
        contactNumber,
        email,
        socialMedia,
        discipler,
        disciples: disciplesArray,
        discipleshipClasses: classes,
        isPartOfOutreach,
      });

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Failed to update profile.");
      }
    });
  };

  if (success) {
    return (
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-8 text-center space-y-3 shadow-md">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Details Updated!</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Thank you, {nickname || name.split(" ")[0]}! Your connect profile has been updated.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-6 space-y-5 shadow-md"
    >
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      {/* 1. Member Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          <User className="w-3.5 h-3.5 text-[#FF6B00]" /> 1. Member Information
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>Connect Name</span>
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </label>
            <input
              type="text"
              disabled
              readOnly
              value={nickname}
              placeholder="Assigned by Admin"
              title="Nicknames are managed by Connect Leadership"
              className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200/70 text-xs font-bold text-slate-500 cursor-not-allowed select-none opacity-80"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Birthdate</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="0917XXXXXXX"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Social Media (FB / IG)</label>
          <input
            type="text"
            value={socialMedia}
            onChange={(e) => setSocialMedia(e.target.value)}
            placeholder="Facebook or Instagram link / name"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
          />
        </div>
      </div>

      {/* 2. Discipleship */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> 2. Discipleship Journey
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discipler</label>
          <input
            type="text"
            value={discipler}
            onChange={(e) => setDiscipler(e.target.value)}
            placeholder="Name of your discipler"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disciple/s</label>
          <textarea
            rows={2}
            value={disciples}
            onChange={(e) => setDisciples(e.target.value)}
            placeholder="Put each disciple's full name on a new line..."
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
          />
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Award className="w-3 h-3 text-indigo-500" /> Completed Classes & Workshops
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            {DISCIPLESHIP_CLASSES.map((cls) => {
              const checked = classes.includes(cls);
              return (
                <label
                  key={cls}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    checked
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-slate-200/70 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleClass(cls)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span className="truncate">{cls}</span>
                </label>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPartOfOutreach}
            onChange={(e) => setIsPartOfOutreach(e.target.checked)}
            className="w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
          />
          <span className="text-xs font-bold text-slate-700">Part of an Outreach Ministry</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save My Details"}
      </button>
    </form>
  );
}