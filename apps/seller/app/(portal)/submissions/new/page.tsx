"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { CreateSubmissionSchema, CATEGORY_VALUES, categoryLabel } from "@thread/types";
import { api } from "@/lib/api";
import type { CreateSubmission } from "@thread/types";
import { PhotoUpload } from "@/components/submissions/PhotoUpload";
import { formatPrice } from "@thread/utils";

const STEPS = [
  { num: 1, label: "Item Basics" },
  { num: 2, label: "Condition" },
  { num: 3, label: "Photos" },
  { num: 4, label: "Description" },
  { num: 5, label: "Review" },
];

const GENDERS = ["WOMEN", "MEN", "UNISEX"];
const CONDITIONS = [
  { value: "BRAND_NEW", label: "Brand New", desc: "Never worn, tags may be attached" },
  { value: "EXCELLENT", label: "Excellent", desc: "Barely worn, like new condition" },
  { value: "GOOD", label: "Good", desc: "Some light signs of wear" },
  { value: "FAIR", label: "Fair", desc: "Visible wear but still sellable" },
];

export default function NewSubmissionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["seller-profile"],
    queryFn: () => api.get<{ isVerified: boolean }>("/sellers/me"),
  });
  const isVerified = (profile as any)?.isVerified ?? false;

  const form = useForm<CreateSubmission>({
    resolver: zodResolver(CreateSubmissionSchema),
    defaultValues: { photos: [], genderTarget: "WOMEN", condition: "GOOD" },
  });
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;

  const photos = watch("photos");
  const category = watch("category");
  const gender = watch("genderTarget");
  const condition = watch("condition");

  const onSubmit = async (data: CreateSubmission) => {
    setError(null);
    try {
      const submission = await api.post<{ id: string }>("/submissions", data);
      router.push(`/submissions/${submission.id}?submitted=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    }
  };

  if (profileLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <div className="animate-pulse h-8 bg-gray-100 rounded-xl w-48 mb-10" />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-64" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Not Yet Verified</h2>
          <p className="text-gray-600 text-sm max-w-sm mx-auto mb-6">
            Your seller account is pending verification by our team. You&apos;ll be able to submit items once your account has been approved — usually within 24 hours.
          </p>
          <button
            onClick={() => router.push("/submissions")}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-medium transition-colors"
          >
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 transition-colors ${
              step === s.num ? "bg-gray-900 border-gray-900 text-white" :
              step > s.num ? "bg-gray-900 border-gray-900 text-white" :
              "border-gray-300 text-gray-400"
            }`}>
              {step > s.num ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
              ) : s.num}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 transition-colors ${step > s.num ? "bg-gray-900" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Item Basics</h2>
                <p className="text-sm text-gray-500 mt-0.5">Tell us about the item you want to sell</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_VALUES.map((c) => (
                    <button key={c} type="button" onClick={() => setValue("category", c as any)}
                      className={`border rounded-xl px-3 py-2 text-xs font-medium text-center transition-colors ${
                        category === c ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}>
                      {categoryLabel(c)}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Item Type *</label>
                <input type="text" placeholder="e.g. Jacket, Blouse, Sneakers"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  {...register("itemType")} />
                {errors.itemType && <p className="text-xs text-red-500">{errors.itemType.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Brand (if known)</label>
                <input type="text" placeholder="e.g. Zara, Nike, or leave blank"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  {...register("brand")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Size *</label>
                  <input type="text" placeholder="e.g. M, 42, OS"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    {...register("size")} />
                  {errors.size && <p className="text-xs text-red-500">{errors.size.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">For *</label>
                  <div className="flex gap-2">
                    {GENDERS.map((g) => (
                      <button key={g} type="button" onClick={() => setValue("genderTarget", g as any)}
                        className={`flex-1 border rounded-xl py-3 text-sm font-medium transition-colors ${
                          gender === g ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}>
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Condition</h2>
                <p className="text-sm text-gray-500 mt-0.5">Be honest — buyers trust accurate condition descriptions</p>
              </div>

              <div className="space-y-2">
                {CONDITIONS.map(({ value, label, desc }) => (
                  <button key={value} type="button" onClick={() => setValue("condition", value as any)}
                    className={`w-full flex items-center justify-between border rounded-xl px-4 py-3.5 text-sm text-left transition-colors ${
                      condition === value ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 hover:border-gray-400"
                    }`}>
                    <span className="font-medium">{label}</span>
                    <span className={`text-xs ${condition === value ? "text-gray-300" : "text-gray-400"}`}>{desc}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Condition Note (optional)</label>
                <textarea placeholder="Describe any flaws, stains, or wear marks..." rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                  {...register("conditionNote")} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Photos</h2>
                <p className="text-sm text-gray-500 mt-0.5">Upload 3–8 clear photos. Good lighting = faster approval.</p>
              </div>
              <PhotoUpload value={photos} onChange={(urls) => setValue("photos", urls, { shouldValidate: true })} />
              {errors.photos && <p className="text-xs text-red-500">{errors.photos.message as string}</p>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Description & Price</h2>
                <p className="text-sm text-gray-500 mt-0.5">Help buyers fall in love with your item</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Item Description *</label>
                <textarea placeholder="Describe the item — material, fit, style, occasion..." rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                  {...register("sellerDescription")} />
                {errors.sellerDescription && <p className="text-xs text-red-500">{errors.sellerDescription.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Your Desired Payout ($) *</label>
                <input type="number" placeholder="e.g. 50.00" step="0.01" min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  {...register("desiredPayoutPrice", { valueAsNumber: true, setValueAs: (v: string) => Math.round(parseFloat(v) * 100) })} />
                <p className="text-xs text-gray-400">Enter the dollar amount you'd like to receive as payout. This is negotiable.</p>
                {errors.desiredPayoutPrice && <p className="text-xs text-red-500">{errors.desiredPayoutPrice.message}</p>}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Review & Submit</h2>
                <p className="text-sm text-gray-500 mt-0.5">Our team will review within 48 hours and get back to you.</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{watch("category")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Item Type</span><span className="font-medium">{watch("itemType")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Size</span><span className="font-medium">{watch("size")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Condition</span><span className="font-medium">{watch("condition")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Photos</span><span className="font-medium">{photos.length} uploaded</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2"><span className="text-gray-500">Desired Payout</span><span className="font-semibold text-gray-900">{formatPrice(watch("desiredPayoutPrice") ?? 0)}</span></div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">{error}</div>}

        <div className="mt-6 flex justify-between">
          <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            Back
          </button>

          {step < 5 ? (
            <button type="button" onClick={async () => {
              const STEP_FIELDS: Record<number, (keyof CreateSubmission)[]> = {
                1: ["category", "itemType", "size", "genderTarget"],
                2: ["condition"],
                3: ["photos"],
                4: ["sellerDescription", "desiredPayoutPrice"],
              };
              const fields = STEP_FIELDS[step] ?? [];
              const valid = fields.length === 0 || await form.trigger(fields);
              if (valid) setStep(s => s + 1);
            }}
              className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-medium transition-colors">
              Next →
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-medium disabled:opacity-60 transition-colors">
              {isSubmitting ? "Submitting..." : "Submit Item"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
