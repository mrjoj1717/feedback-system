import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import RatingStars from '../feedback/RatingStars';

export default function RecentFeedbacks({ feedbacks }) {
  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد تقييمات حتى الآن
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <div key={feedback.id} className="border-b border-gray-200 pb-4 last:border-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-gray-900">
                  {feedback.visitorName || 'زائر مجهول'}
                </span>
                <span className="text-sm text-gray-500">
                  {format(new Date(feedback.createdAt), 'dd MMM yyyy', { locale: ar })}
                </span>
              </div>
              <div className="scale-75 origin-right">
                <RatingStars rating={feedback.rating} readonly={true} />
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              feedback.status === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : feedback.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {feedback.status === 'approved' ? 'موافق عليه' : 
               feedback.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
            </span>
          </div>
          {feedback.comment && (
            <p className="text-gray-700 text-sm mt-2">{feedback.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
