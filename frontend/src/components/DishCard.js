import React from 'react';

export default function DishCard({ dish }) {
  const progress = Math.min((dish.total_contributed / dish.target_people) * 100, 100);
  const remaining = Math.max(dish.target_people - dish.total_contributed, 0);
  const isFull = dish.total_contributed >= dish.target_people;

  return (
    <div
      data-testid={`dish-card-${dish.id}`}
      className={`rounded-2xl border p-5 transition-all ${
        isFull
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-gray-200 hover:border-amber-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate">
            {dish.name}
          </h3>
          {dish.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{dish.description}</p>
          )}
        </div>
        {isFull ? (
          <span
            data-testid="dish-status-full"
            className="shrink-0 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full uppercase tracking-wide"
          >
            Full
          </span>
        ) : (
          <span
            data-testid="dish-status-needs"
            className="shrink-0 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full"
          >
            Needs {remaining} more
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-600 font-medium">
            {dish.total_contributed} / {dish.target_people} people
          </span>
          <span className="text-gray-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {dish.contributions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">
            Contributors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dish.contributions.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                <span className="font-medium">{c.participant?.name ?? 'Unknown'}</span>
                <span className="text-gray-400">&middot;</span>
                <span>{c.quantity_people}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
