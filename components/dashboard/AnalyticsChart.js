import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AnalyticsChart({ data }) {
  const formattedData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'dd/MM', { locale: ar }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="views" 
          stroke="#3b82f6" 
          name="الزيارات"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="feedbacks" 
          stroke="#eab308" 
          name="التقييمات"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
