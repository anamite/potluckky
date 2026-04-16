import React, { useState } from 'react';
import axios from 'axios';
import { ChefHat, Plus, Users, Baby, Utensils, Check, Trash2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const createEmptyDishEntry = () => ({
  id: Date.now() + Math.random(),
  dishChoice: 'existing',
  selectedDishId: '',
  newDishName: '',
  newDishDescription: '',
  quantityPeople: '',
});

export default function ContributionForm({ dishes, onSuccess }) {
  const [name, setName] = useState('');
  const [totalPeople, setTotalPeople] = useState('0');
  const [kidsAbove6, setKidsAbove6] = useState('0');
  const [dishEntries, setDishEntries] = useState([createEmptyDishEntry()]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleNumberChange = (setter) => (e) => {
    const val = e.target.value;
    if (val === '') {
      setter('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setter(String(num));
    }
  };

  const updateDishEntry = (entryId, field, value) => {
    setDishEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      )
    );
  };

  const addDishEntry = () => {
    setDishEntries((prev) => [...prev, createEmptyDishEntry()]);
  };

  const removeDishEntry = (entryId) => {
    if (dishEntries.length <= 1) return;
    setDishEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    const parsedTotalPeople = parseInt(totalPeople, 10) || 0;
    const parsedKidsAbove6 = parseInt(kidsAbove6, 10) || 0;

    // Validate all dish entries
    for (let i = 0; i < dishEntries.length; i++) {
      const entry = dishEntries[i];
      const dishNum = dishEntries.length > 1 ? ` (Dish ${i + 1})` : '';
      if (entry.dishChoice === 'existing' && !entry.selectedDishId) {
        setError(`Please select a dish${dishNum}.`);
        return;
      }
      if (entry.dishChoice === 'new' && !entry.newDishName.trim()) {
        setError(`Please enter a dish name${dishNum}.`);
        return;
      }
      const qty = parseInt(entry.quantityPeople, 10);
      if (!qty || qty < 1) {
        setError(`Quantity must be at least 1${dishNum}.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        total_people: parsedTotalPeople,
        kids_above_6: parsedKidsAbove6,
        dish_entries: dishEntries.map((entry) => ({
          dish_choice: entry.dishChoice,
          selected_dish_id: entry.selectedDishId,
          new_dish_name: entry.newDishName,
          new_dish_description: entry.newDishDescription,
          quantity_people: parseInt(entry.quantityPeople, 10) || 1,
        })),
      };

      await axios.post(`${API}/contributions/submit`, payload);
      setSubmitted(true);
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save contribution. Please try again.';
      setError(msg);
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div
        data-testid="contribution-success"
        className="bg-white rounded-2xl border border-emerald-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">You're all set!</h3>
        <p className="text-gray-500 mb-6">
          Your contribution has been recorded. Thank you for joining!
        </p>
        <button
          data-testid="add-another-contribution-btn"
          onClick={() => {
            setSubmitted(false);
            setName('');
            setTotalPeople('0');
            setKidsAbove6('0');
            setDishEntries([createEmptyDishEntry()]);
          }}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Add another contribution
        </button>
      </div>
    );
  }

  return (
    <form
      data-testid="contribution-form"
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Sign Up to Cook</h2>
            <p className="text-xs text-gray-500">Fill in your details and choose dishes</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Person Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Your Info
          </h3>
          <p className="text-xs text-gray-400 -mt-2">Friends should register separately</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
            <input
              data-testid="input-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Family Members
                </span>
              </label>
              <input
                data-testid="input-total-people"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={totalPeople}
                onChange={handleNumberChange(setTotalPeople)}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5" /> Kids Above 6
                </span>
              </label>
              <input
                data-testid="input-kids-above-6"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={kidsAbove6}
                onChange={handleNumberChange(setKidsAbove6)}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Dish Entries */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Dishes
            </h3>
            {dishEntries.length > 0 && (
              <span className="text-xs text-gray-400">
                {dishEntries.length} {dishEntries.length === 1 ? 'dish' : 'dishes'}
              </span>
            )}
          </div>

          {dishEntries.map((entry, idx) => (
            <DishEntryRow
              key={entry.id}
              entry={entry}
              index={idx}
              totalEntries={dishEntries.length}
              availableDishes={dishes}
              onUpdate={(field, value) => updateDishEntry(entry.id, field, value)}
              onRemove={() => removeDishEntry(entry.id)}
            />
          ))}

          <button
            data-testid="add-another-dish-btn"
            type="button"
            onClick={addDishEntry}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium border-2 border-dashed border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Another Dish
          </button>
        </div>

        {error && (
          <div
            data-testid="form-error"
            className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
          >
            {error}
          </div>
        )}

        <button
          data-testid="submit-contribution-btn"
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Submit Contribution'}
        </button>
      </div>
    </form>
  );
}

function DishEntryRow({ entry, index, totalEntries, availableDishes, onUpdate, onRemove }) {
  const handleQtyChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onUpdate('quantityPeople', '');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      onUpdate('quantityPeople', String(num));
    }
  };

  return (
    <div
      data-testid={`dish-entry-${index}`}
      className="bg-gray-50 rounded-xl p-4 space-y-3 relative"
    >
      {totalEntries > 1 && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500">Dish {index + 1}</span>
          <button
            data-testid={`remove-dish-${index}`}
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          data-testid={`dish-choice-existing-${index}`}
          type="button"
          onClick={() => onUpdate('dishChoice', 'existing')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
            entry.dishChoice === 'existing'
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          Join Existing
        </button>
        <button
          data-testid={`dish-choice-new-${index}`}
          type="button"
          onClick={() => onUpdate('dishChoice', 'new')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
            entry.dishChoice === 'new'
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Create New
        </button>
      </div>

      {entry.dishChoice === 'existing' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Select a Dish</label>
          <select
            data-testid={`select-dish-${index}`}
            value={entry.selectedDishId}
            onChange={(e) => onUpdate('selectedDishId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-white"
          >
            <option value="">Choose a dish...</option>
            {availableDishes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {entry.dishChoice === 'new' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dish Name</label>
            <input
              data-testid={`input-new-dish-name-${index}`}
              type="text"
              value={entry.newDishName}
              onChange={(e) => onUpdate('newDishName', e.target.value)}
              placeholder="e.g. Chicken Biryani"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              data-testid={`input-new-dish-desc-${index}`}
              type="text"
              value={entry.newDishDescription}
              onChange={(e) => onUpdate('newDishDescription', e.target.value)}
              placeholder="e.g. Spicy, vegetarian..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Cook for how many people?
        </label>
        <input
          data-testid={`input-quantity-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={entry.quantityPeople}
          onChange={handleQtyChange}
          placeholder="1"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
}
