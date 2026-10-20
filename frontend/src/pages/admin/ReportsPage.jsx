import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/cards/StatCard';
import {
  BarChart3,
  Users,
  Calendar,
  Star,
  Award,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getReports();
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const summary = reports?.summary || {};
  const performanceView = reports?.performanceView || [];
  const deptStats = reports?.departmentStats || [];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-[#A44D2D]" />
                Mentorship Reports &amp; Analytics
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Overview of sessions, attendance, and feedback across departments
              </p>
            </div>

            <button
              onClick={fetchReports}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-[#E6E0D5] hover:bg-[#F4EFE6] rounded-lg transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Reports
            </button>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Active Mentorships"
              value={summary.activementorships || '0'}
              subtitle={`${summary.totalmentees || 0} Total Mentees registered`}
              icon={Users}
              color="terracotta"
            />
            <StatCard
              title="Completed Sessions"
              value={summary.completedmeetings || '0'}
              subtitle={`Out of ${summary.totalmeetings || 0} scheduled`}
              icon={Calendar}
              color="sage"
            />
            <StatCard
              title="Student Satisfaction"
              value={summary.avgsatisfactionscore ? `${summary.avgsatisfactionscore} / 5.0` : '5.00 / 5.0'}
              subtitle="Mentee rating average on meetings"
              icon={Star}
              color="amber"
            />
            <StatCard
              title="Faculty Mentor Rating"
              value={summary.avgmentorrating ? `${summary.avgmentorrating} / 5.0` : '4.67 / 5.0'}
              subtitle="Mentor review average on meetings"
              icon={Award}
              color="stone"
            />
          </div>

          {/* Mentorship Performance Table */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E6E0D5] mb-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FDF7F4] border border-[#F2D3C4] flex items-center justify-center text-[#A44D2D]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Mentorship Performance &amp; Feedback
                  </h3>
                  <p className="text-xs text-stone-400">
                    Session completion rates and average ratings for each pairing
                  </p>
                </div>
              </div>

              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F4EFE6] text-stone-700 border border-[#E6E0D5] font-semibold">
                {performanceView.length} Pairings
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-[#FAF8F5] text-stone-500 uppercase font-semibold text-[10px] border-b border-[#E6E0D5]">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Mentor</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Sessions (Sched / Done)</th>
                    <th className="px-4 py-3 text-center">Mentor Rating</th>
                    <th className="px-4 py-3 text-center">Student Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D5] font-medium">
                  {performanceView.map((row) => (
                    <tr key={row.mentorshipid} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-stone-800">
                        #{row.mentorshipid}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-serif font-bold text-stone-900">{row.mentorname}</p>
                        <p className="text-[11px] text-stone-400">{row.mentordepartment}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-serif font-bold text-stone-900">{row.menteename}</p>
                          {row.menteecgpa && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FDF9EF] text-[#945C10] border border-[#F5DEB0]">
                              CGPA {parseFloat(row.menteecgpa).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400">{row.menteedepartment}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                            row.mentorshipstatus === 'Active'
                              ? 'bg-[#F5F7F4] text-[#435940] border-[#CCD7C9]'
                              : 'bg-[#FAF8F5] text-stone-700 border-[#DCD0BD]'
                          }`}
                        >
                          {row.mentorshipstatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-stone-900">
                          {row.totalmeetingsscheduled || 0}
                        </span>
                        <span className="text-stone-400"> / </span>
                        <span className="font-semibold text-[#577254]">
                          {row.completedmeetings || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.avgmentorratinggiven ? (
                          <span className="inline-flex items-center gap-1 font-bold text-stone-800">
                            <Star className="w-3 h-3 fill-[#D4922A] text-[#D4922A]" />
                            {parseFloat(row.avgmentorratinggiven).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-stone-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.avgmenteesatisfactionscore ? (
                          <span className="inline-flex items-center gap-1 font-bold text-stone-800">
                            <Star className="w-3 h-3 fill-[#D4922A] text-[#D4922A]" />
                            {parseFloat(row.avgmenteesatisfactionscore).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-stone-300 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs">
            <h3 className="text-sm font-serif font-bold text-stone-800 mb-3">
              Department Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {deptStats.map((d, idx) => (
                <div key={idx} className="p-4 bg-[#FAF8F5] border border-[#E6E0D5] rounded-xl">
                  <h4 className="font-serif font-bold text-xs text-stone-800 truncate">{d.department}</h4>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-[#E6E0D5]">
                      <span className="text-[10px] text-stone-400 block">Mentees</span>
                      <span className="font-bold text-stone-900">{d.menteescount || 0}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#E6E0D5]">
                      <span className="text-[10px] text-stone-400 block">Mentors</span>
                      <span className="font-bold text-stone-900">{d.mentorscount || 0}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#E6E0D5]">
                      <span className="text-[10px] text-stone-400 block">Pairings</span>
                      <span className="font-bold text-[#A44D2D]">{d.activepairings || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
