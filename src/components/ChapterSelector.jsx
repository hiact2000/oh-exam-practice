export default function ChapterSelector({
  categories,
  subcategories,
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col text-sm text-gray-600">
        大章節
        <select
          className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-gray-900"
          value={selectedCategory ?? ''}
          onChange={(event) => onCategoryChange(event.target.value || null)}
        >
          <option value="">全部章節</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm text-gray-600">
        小章節
        <select
          className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-gray-900 disabled:bg-gray-100"
          value={selectedSubcategory ?? ''}
          onChange={(event) => onSubcategoryChange(event.target.value || null)}
          disabled={!selectedCategory}
        >
          <option value="">全部小節</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory} value={subcategory}>
              {subcategory}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
