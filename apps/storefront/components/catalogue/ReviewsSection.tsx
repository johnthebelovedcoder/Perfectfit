"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  buyerName: string;
  verified: boolean;
  createdAt: string;
}

interface ReviewStats {
  count: number;
  average: number;
  breakdown: Record<number, number>;
}

interface Props {
  slug: string;
  initialReviews: Review[];
  initialStats: ReviewStats;
}

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </span>
  );
}

function InteractiveStar({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}>
      <Star className={`h-7 w-7 transition-colors ${selected ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-300"}`} />
    </button>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ReviewsSection({ slug, initialReviews, initialStats }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [stats, setStats] = useState<ReviewStats>(initialStats);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const auth = useAuth();

  // Prefill email/name for a logged-in buyer (enables the one-review-per-buyer guard).
  useEffect(() => {
    if (auth?.user.email) setEmail((e) => e || auth.user.email);
  }, [auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !name.trim() || !body.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/v1/items/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title.trim() || undefined, body: body.trim(), buyerName: name.trim(), buyerEmail: email.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: { message?: string }; message?: string };
        throw new Error(err.error?.message ?? err.message ?? `Error ${res.status}`);
      }
      const payload = await res.json() as { data: Review };
      const newReview = payload.data;
      setReviews((prev) => [newReview, ...prev]);
      const newCount = stats.count + 1;
      const newAvg = Math.round(((stats.average * stats.count + rating) / newCount) * 10) / 10;
      const newBreakdown = { ...stats.breakdown, [rating]: (stats.breakdown[rating] ?? 0) + 1 };
      setStats({ count: newCount, average: newAvg, breakdown: newBreakdown });
      setSubmitted(true);
      setShowForm(false);
      setRating(0); setTitle(""); setBody(""); setName(""); setEmail(auth?.user.email ?? "");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="mt-16 border-t border-gray-100 pt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reviews &amp; Ratings</h2>
          {stats.count > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{stats.count} review{stats.count !== 1 ? "s" : ""}</p>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setSubmitted(false); }}
            className="text-sm font-medium px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Aggregate */}
      {stats.count > 0 && (
        <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-gray-50 rounded-2xl">
          {/* Big average */}
          <div className="flex flex-col items-center justify-center sm:border-r sm:border-gray-200 sm:pr-8 sm:min-w-[120px]">
            <span className="text-5xl font-bold text-gray-900">{stats.average.toFixed(1)}</span>
            <StarRow rating={Math.round(stats.average)} />
            <span className="text-xs text-gray-400 mt-1">{stats.count} review{stats.count !== 1 ? "s" : ""}</span>
          </div>
          {/* Breakdown bars */}
          <div className="flex-1 space-y-2 justify-center flex flex-col">
            {[5, 4, 3, 2, 1].map((star) => {
              const cnt = stats.breakdown[star] ?? 0;
              const pct = stats.count > 0 ? (cnt / stats.count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs w-3 text-gray-500 text-right">{star}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-4">{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 border border-gray-200 rounded-2xl p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Your Review</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
          </div>

          {/* Star picker */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Rating <span className="text-rose-500">*</span></p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                >
                  <Star className={`h-8 w-8 transition-colors ${
                    s <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-200"
                  }`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Your name <span className="text-rose-500">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="e.g. Sarah M."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Email <span className="text-gray-400 font-normal">(optional — limits you to one review per item)</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="e.g. Great quality!"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Review <span className="text-rose-500">*</span></label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              placeholder="Share your experience with this item..."
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{submitError}</p>
          )}
          <button
            type="submit"
            disabled={submitting || !rating || !name.trim() || !body.trim()}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      )}

      {submitted && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
          ✓ Thank you! Your review has been added.
        </div>
      )}

      {/* Review cards */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star className="h-10 w-10 mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">No reviews yet</p>
          <p className="text-sm mt-1">Be the first to review this item.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    {r.buyerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{r.buyerName}</span>
                      {r.verified && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </div>
                    <StarRow rating={r.rating} />
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(r.createdAt)}</span>
              </div>
              {r.title && <p className="text-sm font-semibold text-gray-800 mb-1">{r.title}</p>}
              <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
