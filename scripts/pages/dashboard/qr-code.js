import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import QRCode from 'qrcode';

export default function QRCodePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [qrCode, setQrCode] = useState('');
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user?.ownedBusinesses?.length > 0) {
      fetchBusiness(user.ownedBusinesses[0]);
    } else {
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  const fetchBusiness = async (businessId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/business/${businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBusiness(data);
        
        // توليد QR Code
        const url = `${window.location.origin}/r/${data.slug}`;
        const qr = await QRCode.toDataURL(url, { 
          width: 800,
          margin: 2,
          color: {
            dark: '#D4AF37',
            light: '#FFFFFF'
          }
        });
        setQrCode(qr);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `qr-code-${business.slug}.png`;
    link.href = qrCode;
    link.click();
  };

  const printQR = () => {
    const printWindow = window.open('', '', 'width=800,height=1000');
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة QR Code - ${business.name}</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 1cm; }
            }
            body { 
              text-align: center; 
              padding: 40px;
              font-family: 'Segoe UI', Arial, sans-serif;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              border: 5px solid #D4AF37;
              border-radius: 30px;
              padding: 40px;
              background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%);
            }
            h1 { 
              color: #D4AF37; 
              margin: 0 0 20px 0;
              font-size: 48px;
              font-weight: bold;
            }
            .subtitle {
              font-size: 28px;
              color: #666;
              margin-bottom: 40px;
              font-weight: 500;
            }
            img { 
              width: 400px; 
              height: 400px;
              border: 8px solid #D4AF37;
              border-radius: 20px;
              padding: 20px;
              background: white;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .instruction {
              font-size: 24px;
              color: #333;
              margin-top: 30px;
              font-weight: 600;
            }
            .url {
              font-size: 18px;
              color: #999;
              margin-top: 20px;
              font-family: monospace;
            }
            .emoji {
              font-size: 60px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">✨</div>
            <h1>${business.name}</h1>
            <p class="subtitle">شارك تجربتك معنا</p>
            <img src="${qrCode}" alt="QR Code" />
            <p class="instruction">📱 امسح الكود لتقييم تجربتك</p>
            <p class="url">${window.location.origin}/r/${business.slug}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">لا توجد أعمال مرتبطة بحسابك</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">رمز QR للتقييم</h1>
          <p className="text-gray-600 mt-2">اطبع الكود وضعه في مكان بارز لعملائك</p>
        </div>

        {qrCode && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Preview */}
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-br from-gold-50 to-white p-8 rounded-3xl border-4 border-gold-500">
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{business.name}</h2>
                <p className="text-gray-600 mb-6">شارك تجربتك معنا</p>
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-80 h-80 mx-auto border-4 border-gold-500 rounded-2xl p-4 bg-white shadow-xl"
                />
                <p className="text-lg text-gray-700 mt-6 font-semibold">
                  📱 امسح الكود لتقييم تجربتك
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={downloadQR}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-lg font-semibold flex items-center gap-2 shadow-lg"
              >
                <span className="text-2xl">📥</span>
                تحميل الصورة
              </button>
              <button
                onClick={printQR}
                className="bg-gold-600 text-white px-8 py-4 rounded-lg hover:bg-gold-700 text-lg font-semibold flex items-center gap-2 shadow-lg"
              >
                <span className="text-2xl">🖨️</span>
                طباعة
              </button>
            </div>

            {/* Tips */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                نصائح الاستخدام
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-xl">🍽️</span>
                  <span>ضع الكود على الطاولات في مطعمك أو كافيهك</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xl">💳</span>
                  <span>ضعه على الكاونتر عند نقطة الدفع</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xl">🧾</span>
                  <span>أضفه في الفواتير المطبوعة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xl">🖼️</span>
                  <span>ضعه في ستاند أكريليك جذاب</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xl">🪧</span>
                  <span>استخدمه في لافتات الحائط</span>
                </li>
              </ul>
            </div>

            {/* Direct Link */}
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-lg mb-3">🔗 رابط مباشر</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/r/${business.slug}`}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  dir="ltr"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/r/${business.slug}`);
                    alert('تم نسخ الرابط! ✅');
                  }}
                  className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
                >
                  نسخ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
