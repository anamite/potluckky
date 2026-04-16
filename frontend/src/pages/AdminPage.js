import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Lock, Users, Utensils, TrendingUp, ArrowLeft, Download } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ADMIN_PASSWORD = 'potluck2024';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        axios.get(`${API}/participants`),
        axios.get(`${API}/contributions/all`),
      ]);
      setParticipants(pRes.data);
      setDishes(dRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password.');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Participant', 'Total People', 'Kids Above 6', 'Dish', 'Cooking For', 'Submitted At'],
    ];
    dishes.forEach((dish) => {
      dish.contributions.forEach((c) => {
        rows.push([
          c.participant?.name ?? '',
          String(c.participant?.total_people ?? ''),
          String(c.participant?.kids_above_6 ?? ''),
          dish.name,
          String(c.quantity_people),
          c.created_at ? new Date(c.created_at).toLocaleString() : '',
        ]);
      });
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'potluck-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPeople = participants.reduce((s, p) => s + p.total_people, 0);
  const totalKids = participants.reduce((s, p) => s + p.kids_above_6, 0);
  const totalContributed = dishes.reduce((s, d) => s + d.total_contributed, 0);
  const totalTarget = dishes.reduce((s, d) => s + d.target_people, 0);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">Enter password to continue</p>
          </div>
          <form
            data-testid="admin-login-form"
            onSubmit={handleLogin}
            className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                data-testid="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                autoFocus
              />
            </div>
            {error && (
              <p data-testid="admin-login-error" className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <button
              data-testid="admin-login-btn"
              type="submit"
              className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors"
            >
              Sign In
            </button>
          </form>
          <div className="text-center mt-4">
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to main page
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="export-csv-btn"
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              data-testid="admin-refresh-btn"
              onClick={fetchData}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div data-testid="admin-stat-participants" className="text-2xl font-bold text-gray-900">
              {participants.length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Participants</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div data-testid="admin-stat-total-people" className="text-2xl font-bold text-blue-500">
              {totalPeople}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Total People</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div data-testid="admin-stat-covered" className="text-2xl font-bold text-amber-500">
              {totalContributed}
              <span className="text-sm text-gray-400 font-normal">/{totalTarget}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Covered</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div data-testid="admin-stat-kids" className="text-2xl font-bold text-orange-500">
              {totalKids}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Kids (6+)</div>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          {['overview', 'participants', 'contributions'].map((tab) => (
            <button
              key={tab}
              data-testid={`admin-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-16"
              />
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Dish Overview
                </h2>
                {dishes.length === 0 ? (
                  <p className="text-gray-400 text-sm">No dishes added yet.</p>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Dish</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">
                            Contributors
                          </th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600">Progress</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dishes.map((dish) => {
                          const pct = Math.min(
                            (dish.total_contributed / dish.target_people) * 100,
                            100
                          );
                          const isFull = dish.total_contributed >= dish.target_people;
                          return (
                            <tr key={dish.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="font-medium text-gray-900">{dish.name}</div>
                                {dish.description && (
                                  <div className="text-xs text-gray-400 mt-0.5">{dish.description}</div>
                                )}
                              </td>
                              <td className="px-5 py-3.5 hidden sm:table-cell">
                                <div className="text-gray-500 text-xs">
                                  {dish.contributions
                                    .map((c) => `${c.participant?.name} (${c.quantity_people})`)
                                    .join(', ') || '\u2014'}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isFull ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-700 font-medium whitespace-nowrap">
                                    {dish.total_contributed}/{dish.target_people}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {isFull ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                    Full
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                    -{dish.target_people - dish.total_contributed}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4" /> All Participants ({participants.length})
                </h2>
                {participants.length === 0 ? (
                  <p className="text-gray-400 text-sm">No participants yet.</p>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600">Total People</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600">Kids (6+)</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {participants.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-gray-900">{p.name}</td>
                            <td className="px-5 py-3.5 text-right text-gray-600">{p.total_people}</td>
                            <td className="px-5 py-3.5 text-right text-gray-600">{p.kids_above_6}</td>
                            <td className="px-5 py-3.5 text-right text-gray-400 text-xs hidden sm:table-cell">
                              {new Date(p.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-gray-100">
                        <tr className="bg-gray-50">
                          <td className="px-5 py-3 font-semibold text-gray-700">Total</td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900">{totalPeople}</td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900">{totalKids}</td>
                          <td className="hidden sm:table-cell" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contributions' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <Utensils className="w-4 h-4" /> All Contributions
                </h2>
                {dishes.every((d) => d.contributions.length === 0) ? (
                  <p className="text-gray-400 text-sm">No contributions yet.</p>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Participant</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Dish</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600">Cooking For</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dishes.flatMap((dish) =>
                          dish.contributions.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="font-medium text-gray-900">
                                  {c.participant?.name ?? '\u2014'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {c.participant?.total_people} people, {c.participant?.kids_above_6} kids
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-gray-700">{dish.name}</td>
                              <td className="px-5 py-3.5 text-right">
                                <span className="font-semibold text-gray-900">{c.quantity_people}</span>
                                <span className="text-gray-400 text-xs ml-1">people</span>
                              </td>
                              <td className="px-5 py-3.5 text-right text-gray-400 text-xs hidden sm:table-cell">
                                {new Date(c.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
