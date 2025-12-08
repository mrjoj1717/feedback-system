export default function RatingStars({ rating, onRatingChange, readonly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-2 justify-center">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange && onRatingChange(star)}
          disabled={readonly}
          className={`text-4xl transition-all duration-200 ${
            !readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          } ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}
