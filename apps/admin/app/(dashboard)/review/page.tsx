"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Check, X, HelpCircle } from "lucide-react";
import { Button, Badge, Input, Label, Textarea, Select, Skeleton } from "@thread/ui";
import { api } from "@/lib/api";
import { formatPrice, getCloudinaryUrl } from "@thread/utils";

interface Submission {
  id: string;
  itemType: string;
  category: string;
  size: string;
  condition: string;
  photos: string[];
  sellerDescription: string;
  desiredPayoutPrice: number;
  status: string;
  seller: { firstName: string; lastName: string; user: { email: string } };
}

interface ReviewState {
  submissionId: string;
  decision: "ACCEPT" | "REJECT" | "REQUEST_MORE_INFO" | null;
}

export default function ReviewQueuePage() {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<ReviewState>({ submissionId: "", decision: null });
  const [form, setForm] = useState({ retailPrice: "", agreedPayoutPrice: "", rejectionReason: "ITEM_CONDITION_BELOW_STANDARD", rejectionNote: "", moreInfoRequest: "", adminNote: "" });
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => api.get<Submission[]>("/submissions/queue"),
    refetchInterval: 30_000,
  });

  const submissions = data ?? [];

  const reviewMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      api.patch<unknown>(`/submissions/${id}/review`, body),
    onSuccess: () => {
      setMutationError(null);
      void qc.invalidateQueries({ queryKey: ["review-queue"] });
      setReviewing({ submissionId: "", decision: null });
    },
    onError: (err: unknown) =>
      setMutationError(err instanceof Error ? err.message : "Review action failed"),
  });

  const handleReview = (sub: Submission) => {
    if (!reviewing.decision) return;

    let body: unknown;
    if (reviewing.decision === "ACCEPT") {
      body = {
        decision: "ACCEPT",
        retailPrice: Math.round(parseFloat(form.retailPrice) * 100),
        agreedPayoutPrice: Math.round(parseFloat(form.agreedPayoutPrice) * 100),
        adminNote: form.adminNote || undefined,
      };
    } else if (reviewing.decision === "REJECT") {
      body = {
        decision: "REJECT",
        rejectionReason: form.rejectionReason,
        rejectionNote: form.rejectionNote || undefined,
      };
    } else {
      body = { decision: "REQUEST_MORE_INFO", moreInfoRequest: form.moreInfoRequest };
    }

    reviewMutation.mutate({ id: sub.id, body });
  };

  return (
    <div className="space-y-6">
      {mutationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <Badge variant="secondary">{submissions.length} pending</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}</div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-medium">Queue is empty</p>
          <p className="text-sm text-muted-foreground mt-1">No submissions awaiting review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((sub) => {
            const isActive = reviewing.submissionId === sub.id;
            return (
              <div key={sub.id} className="rounded-lg border p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{sub.itemType} · {sub.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.seller.firstName} {sub.seller.lastName} · {sub.seller.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">Size {sub.size} · {sub.condition}</p>
                    <p className="text-sm font-medium mt-1">Desired payout: {formatPrice(sub.desiredPayoutPrice)}</p>
                  </div>
                  {!isActive && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setReviewing({ submissionId: sub.id, decision: "ACCEPT" })}>
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReviewing({ submissionId: sub.id, decision: "REQUEST_MORE_INFO" })}>
                        <HelpCircle className="h-4 w-4 mr-1" /> Info
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setReviewing({ submissionId: sub.id, decision: "REJECT" })}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Photos */}
                <div className="flex gap-2 overflow-x-auto">
                  {sub.photos.map((p, i) => (
                    <div key={i} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={getCloudinaryUrl(p, { width: 96, height: 128 })} alt="" fill sizes="96px" className="object-cover" />
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">{sub.sellerDescription}</p>

                {/* Review form */}
                {isActive && (
                  <div className="border-t pt-4 space-y-4">
                    {reviewing.decision === "ACCEPT" && (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Retail Price ($)</Label>
                            <Input type="number" placeholder="e.g. 49.99" step="0.01" min="0" value={form.retailPrice} onChange={(e) => setForm((f) => ({ ...f, retailPrice: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Agreed Payout ($)</Label>
                            <Input type="number" placeholder="e.g. 29.99" step="0.01" min="0" value={form.agreedPayoutPrice} onChange={(e) => setForm((f) => ({ ...f, agreedPayoutPrice: e.target.value }))} />
                          </div>
                        </div>
                        {form.retailPrice && form.agreedPayoutPrice && (
                          <p className="text-sm text-muted-foreground">
                            Margin: {formatPrice(Math.round((parseFloat(form.retailPrice) - parseFloat(form.agreedPayoutPrice)) * 100))}
                          </p>
                        )}
                        <div className="space-y-1.5">
                          <Label>Admin Note (optional)</Label>
                          <Textarea value={form.adminNote} onChange={(e) => setForm((f) => ({ ...f, adminNote: e.target.value }))} />
                        </div>
                      </>
                    )}

                    {reviewing.decision === "REJECT" && (
                      <>
                        <div className="space-y-1.5">
                          <Label>Rejection Reason</Label>
                          <Select value={form.rejectionReason} onChange={(e) => setForm((f) => ({ ...f, rejectionReason: e.target.value }))}>
                            <option value="ITEM_CONDITION_BELOW_STANDARD">Item condition below standard</option>
                            <option value="CATEGORY_NOT_ACCEPTED">Category not currently accepted</option>
                            <option value="PHOTOS_INSUFFICIENT">Photos insufficient</option>
                            <option value="ITEM_NOT_SELLABLE">Item not sellable</option>
                            <option value="OTHER">Other</option>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Note to Seller (optional)</Label>
                          <Textarea value={form.rejectionNote} onChange={(e) => setForm((f) => ({ ...f, rejectionNote: e.target.value }))} />
                        </div>
                      </>
                    )}

                    {reviewing.decision === "REQUEST_MORE_INFO" && (
                      <div className="space-y-1.5">
                        <Label>What information do you need?</Label>
                        <Textarea value={form.moreInfoRequest} onChange={(e) => setForm((f) => ({ ...f, moreInfoRequest: e.target.value }))} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReview(sub)}
                        disabled={
                          reviewMutation.isPending ||
                          (reviewing.decision === "ACCEPT" && (!form.retailPrice || !form.agreedPayoutPrice)) ||
                          (reviewing.decision === "REQUEST_MORE_INFO" && !form.moreInfoRequest.trim())
                        }
                      >
                        {reviewMutation.isPending ? "Saving..." : "Confirm"}
                      </Button>
                      <Button variant="outline" onClick={() => setReviewing({ submissionId: "", decision: null })}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
