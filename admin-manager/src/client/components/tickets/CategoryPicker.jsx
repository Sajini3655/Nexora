import React from "react";

export default function CategoryPicker({ value, categories, onSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((category) => {
        const selected = value === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className={
              selected
                ? "rounded-xl border-2 border-white bg-white/15 p-3 text-left text-sm font-bold text-white"
                : "rounded-xl border border-white/25 bg-white/5 p-3 text-left text-sm font-semibold text-white/90 hover:bg-white/10"
            }
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
