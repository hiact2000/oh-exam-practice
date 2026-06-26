const CAT_STYLE = {
  active: 'bg-indigo-600 text-white shadow-sm',
  inactive: 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600',
}

const SUBCAT_STYLE = {
  active: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300',
  inactive: 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600',
}

export default function ChapterSelector({
  categories,
  subcategories,
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  counts = {},
}) {
  return (
    <div className="space-y-3">
      {/* 大章節 */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
            !selectedCategory ? CAT_STYLE.active : CAT_STYLE.inactive
          }`}
        >
          全部
          {counts._total != null && (
            <span className={`ml-1.5 text-xs ${!selectedCategory ? 'opacity-75' : 'text-gray-400'}`}>
              {counts._total}
            </span>
          )}
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              selectedCategory === cat ? CAT_STYLE.active : CAT_STYLE.inactive
            }`}
          >
            {cat}
            {counts[cat] != null && (
              <span className={`ml-1.5 text-xs ${selectedCategory === cat ? 'opacity-75' : 'text-gray-400'}`}>
                {counts[cat]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 小章節：選定大章節後展開 */}
      {selectedCategory && subcategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/40 px-3 py-2.5">
          <button
            type="button"
            onClick={() => onSubcategoryChange(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              !selectedSubcategory ? SUBCAT_STYLE.active : SUBCAT_STYLE.inactive
            }`}
          >
            全部小節
            {counts[selectedCategory + '||'] != null && (
              <span className="ml-1 opacity-60">{counts[selectedCategory + '||']}</span>
            )}
          </button>
          {subcategories.map((sub) => (
            <button
              type="button"
              key={sub}
              onClick={() => onSubcategoryChange(sub)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedSubcategory === sub ? SUBCAT_STYLE.active : SUBCAT_STYLE.inactive
              }`}
            >
              {sub}
              {counts[selectedCategory + '||' + sub] != null && (
                <span className="ml-1 opacity-60">{counts[selectedCategory + '||' + sub]}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
