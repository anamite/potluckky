import { useState, useEffect, useCallback } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import DishCard from '@/components/DishCard';
import ContributionForm from '@/components/ContributionForm';
import AdminPage from '@/pages/AdminPage';
import { UtensilsCrossed, RefreshCw, ChevronDown } from 'lucide-react';

function HomePage() {
  const [dishes, setDishes] = useState([]);
  const [rawDishes, setRawDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const { data: dishData } = await supabase
      .from('dishes')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: contribData } = await supabase
      .from('contributions')
      .select('*, participant:participants(*)');

    if (dishData) {
      setRawDishes(dishData);
      const enriched = dishData.map((dish) => {
        const contributions = (contribData ?? []).filter((c) => c.dish_id === dish.id);
        const total = contributions.reduce((sum, c) => sum + c.quantity_people, 0);
        return { ...dish, contributions, total_contributed: total };
      });
      const sorted = enriched.sort((a, b) => {
        const aRem = a.target_people - a.total_contributed;
        const bRem = b.target_people - b.total_contributed;
        const aFull = aRem <= 0;
        const bFull = bRem <= 0;
        if (aFull && !bFull) return 1;
        if (!aFull && bFull) return -1;
        return bRem - aRem;
      });
      setDishes(sorted);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalContributed = dishes.reduce((sum, d) => sum + d.total_contributed, 0);
  const totalTarget = dishes.reduce((sum, d) => sum + d.target_people, 0);
  const fullDishes = dishes.filter((d) => d.total_contributed >= d.target_people).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 data-testid="app-title" className="text-lg font-bold text-gray-900 leading-none">
                Potluck Planner
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Community Feast Coordinator</p>
            </div>
          </div>
          <button
            data-testid="refresh-btn"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div data-testid="stat-dishes" className="text-2xl font-bold text-gray-900">
              {dishes.length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Dishes</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div data-testid="stat-people-covered" className="text-2xl font-bold text-amber-500">
              {totalContributed}
              <span className="text-sm text-gray-400 font-normal">/{totalTarget}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">People Covered</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div data-testid="stat-fully-covered" className="text-2xl font-bold text-emerald-500">
              {fullDishes}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Fully Covered</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Dish Status</h2>
              <span className="text-xs text-gray-400">{dishes.length} dishes</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse"
                  >
                    <div className="h-5 bg-gray-100 rounded-lg w-2/3 mb-3" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-full mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : dishes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No dishes yet</p>
                <p className="text-gray-400 text-sm mt-1">Be the first to add a dish!</p>
              </div>
            ) : (
              <div data-testid="dishes-list" className="space-y-3">
                {dishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="lg:hidden mb-4">
              <button
                data-testid="toggle-form-btn"
                onClick={() => setShowForm(!showForm)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-amber-500 text-white rounded-2xl font-semibold text-sm"
              >
                Sign Up to Cook
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showForm ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <div className={`${showForm ? 'block' : 'hidden'} lg:block`}>
              <ContributionForm
                dishes={rawDishes}
                onSuccess={() => {
                  setShowForm(false);
                  fetchData(true);
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        <Link data-testid="admin-link" to="/admin" className="hover:text-gray-600 transition-colors">
          Admin
        </Link>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
