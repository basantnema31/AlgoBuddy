"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Briefcase, MapPin, Calendar, ChevronLeft, ChevronRight,
  Send, CheckCircle, X, Bookmark, BookmarkCheck
} from "lucide-react";
import Link from "next/link";

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [applying, setApplying] = useState(null);
  const [bookmarking, setBookmarking] = useState(null);
  const [confirmJob, setConfirmJob] = useState(null);

  async function fetchJobs(page) {
    setLoading(true);
    try {
      const res = await fetch(`/api/student-jobs?page=${page}&limit=20`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotalPages(data.totalPages || 0);
      setTotalJobs(data.totalJobs || 0);
      setCurrentPage(data.currentPage || 1);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications() {
    try {
      const res = await fetch("/api/applications?limit=200");
      const data = await res.json();
      setAppliedIds(new Set((data.applications || []).map((a) => a.job_id)));
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  }

  async function fetchBookmarks() {
    try {
      const res = await fetch("/api/bookmarks?limit=200");
      const data = await res.json();
      setBookmarkedIds(new Set(data.bookmarkedIds || []));
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    }
  }

  useEffect(() => {
    fetchJobs(currentPage);
    fetchApplications();
    fetchBookmarks();
  }, [currentPage]);

  async function handleToggleBookmark(jobId) {
    setBookmarking(jobId);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update bookmark");
        return;
      }
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (data.bookmarked) {
          next.add(jobId);
          toast.success("Job bookmarked!");
        } else {
          next.delete(jobId);
          toast.success("Bookmark removed");
        }
        return next;
      });
    } catch (err) {
      toast.error("Something went wrong");
      console.error("Bookmark error:", err);
    } finally {
      setBookmarking(null);
    }
  }

  async function handleApply(jobId) {
    setApplying(jobId);
    setConfirmJob(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to apply");
        return;
      }
      toast.success(data.message || "Application submitted!");
      setAppliedIds((prev) => new Set(prev).add(jobId));
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error("Apply error:", err);
    } finally {
      setApplying(null);
    }
  }

  function handlePrev() {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  }

  function handleNext() {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  }

  function handlePageClick(page) {
    setCurrentPage(page);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Jobs</h1>
            <p className="text-gray-600 mt-1">
              {totalJobs > 0
                ? `Showing ${jobs.length} of ${totalJobs} approved opportunities`
                : "No job listings available"}
            </p>
          </div>
          <Link
            href="/saved-jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <BookmarkCheck className="h-4 w-4" />
            Saved Jobs
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-600">No jobs found</h2>
            <p className="text-gray-500 mt-1">Check back later for new opportunities.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {jobs.map((job) => {
                const alreadyApplied = appliedIds.has(job.id);
                const bookmarked = bookmarkedIds.has(job.id);
                const isBookmarking = bookmarking === job.id;
                return (
                  <div key={job.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                          <button
                            onClick={() => handleToggleBookmark(job.id)}
                            disabled={isBookmarking}
                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                          >
                            {bookmarked ? (
                              <BookmarkCheck className="h-5 w-5 text-indigo-600 fill-indigo-600" />
                            ) : (
                              <Bookmark className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-indigo-600 font-medium mt-1">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                          )}
                          {job.job_type && (
                            <span className="capitalize">{job.job_type.replace("-", " ")}</span>
                          )}
                          {job.experience_level && (
                            <span className="capitalize">{job.experience_level.replace("-", " ")}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {job.salary_range && (
                          <p className="mt-2 text-sm font-medium text-green-600">{job.salary_range}</p>
                        )}
                        <p className="mt-3 text-gray-600 line-clamp-3">{job.description}</p>
                      </div>

                      <div className="ml-6 flex-shrink-0 self-start">
                        {alreadyApplied ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-4 w-4" />
                            Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmJob(job)}
                            disabled={applying === job.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            <Send className="h-4 w-4" />
                            {applying === job.id ? "Applying..." : "Apply with Profile"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageClick(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-4">
              Page {currentPage} of {totalPages}
            </p>
          </>
        )}
      </div>

      {confirmJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Application</h3>
              <button onClick={() => setConfirmJob(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Your profile details (name, email, branch, CGPA, skills, resume link) will be shared with <strong>{confirmJob.company}</strong> for the position of <strong>{confirmJob.title}</strong>.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmJob(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = confirmJob.id;
                  setConfirmJob(null);
                  handleApply(id);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
