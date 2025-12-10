import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Head from 'next/head';
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
        
        const url = `${window.location.origin}/r/${data.slug}`;
        const qr = await QRCode.toDataURL(url, { 
          width: 600,
          margin: 1,
          color: {
            dark: '#000000',
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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1000;
  canvas.height = 1400;
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // النص العلوي
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 52px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('شاركنا تقييمك', 500, 80);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 42px Arial';
  ctx.fillText('🎁 واحصل على خصومات حصرية 🎁', 500, 135);
  
  ctx.fillStyle = '#CCCCCC';
  ctx.font = '28px Arial';
  ctx.fillText('Share Your Review & Get Exclusive Discounts', 500, 175);
  
  // رسم شعار Google Maps الحقيقي
  const googleMapsLogo = new Image();
  googleMapsLogo.crossOrigin = 'anonymous';
  googleMapsLogo.onload = () => {
    // رسم الشعار
    ctx.drawImage(googleMapsLogo, 425, 200, 150, 150);
    
    // النص
    ctx.fillStyle = '#999999';
    ctx.font = '28px Arial';
    ctx.fillText('Google Maps', 500, 380);
    
    ctx.font = '42px Arial';
    ctx.fillText('⭐⭐⭐⭐⭐', 500, 430);
    
    // رسم QR Code
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 250, 470, 500, 500);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('قرّب جوالك أو امسح الكود', 500, 1025);
      
      ctx.font = '28px Arial';
      ctx.fillText('Tap or Scan to start review', 500, 1065);
      
      // رسم أيقونة NFC والهاتف
      ctx.beginPath();
      ctx.arc(420, 1155, 50, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(420, 1155, 30 + (i * 15), 0, Math.PI * 0.5);
        ctx.stroke();
      }
      
      ctx.strokeRect(520, 1105, 80, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(530, 1115, 60, 80);
      
      ctx.fillStyle = '#666666';
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${business.slug.toUpperCase()}`, 50, 1340);
      
      ctx.textAlign = 'right';
      ctx.font = '18px Arial';
      ctx.fillText('Powered by', 950, 1320);
      ctx.font = 'bold 20px Arial';
      ctx.fillText('taplinksa.com', 950, 1345);
      
      const link = document.createElement('a');
      link.download = `qr-code-${business.slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    qrImg.src = qrCode;
  };
  
  // استخدام شعار Google Maps من URL عام
  googleMapsLogo.src = 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg';
};



  const printQR = () => {
    const printWindow = window.open('', '', 'width=1000,height=1400');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>طباعة QR Code - ${business.name}</title>
          <style>
            @media print {
              @page { 
                margin: 0; 
                size: 100mm 140mm;
              }
              body { margin: 0; padding: 0; }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #000000;
              color: white;
              width: 100mm;
              height: 140mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              padding: 20px;
            }
            .header {
              text-align: center;
              width: 100%;
            }
            .header h1 {
              font-size: 36px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #FFFFFF;
            }
            .header .discount {
              font-size: 28px;
              font-weight: bold;
              color: #FFD700;
              margin-bottom: 5px;
            }
            .header p {
              font-size: 16px;
              color: #CCCCCC;
              margin-bottom: 10px;
            }
            .google-icon {
              width: 70px;
              height: 70px;
              margin: 10px auto;
              background: linear-gradient(135deg, #4285F4, #EA4335, #FBBC05, #34A853);
              border-radius: 50%;
            }
            .google-text {
              font-size: 18px;
              color: #999999;
              margin-bottom: 8px;
            }
            .stars {
              font-size: 28px;
              letter-spacing: 4px;
              margin-bottom: 15px;
            }
            .qr-container {
              background: white;
              padding: 12px;
              border-radius: 15px;
              margin: 15px 0;
            }
            .qr-container img {
              width: 320px;
              height: 320px;
              display: block;
            }
            .instructions {
              text-align: center;
              margin-top: 15px;
            }
            .instructions h2 {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .instructions p {
              font-size: 14px;
              color: #CCCCCC;
            }
            .nfc-section {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 20px;
              margin: 15px 0;
            }
            .nfc-icon {
              width: 70px;
              height: 70px;
              border: 3px solid white;
              border-radius: 50%;
              position: relative;
            }
            .nfc-icon::before,
            .nfc-icon::after {
              content: '';
              position: absolute;
              border: 3px solid white;
              border-radius: 50%;
            }
            .nfc-icon::before {
              top: -10px;
              left: -10px;
              right: -10px;
              bottom: -10px;
              border-right-color: transparent;
              border-bottom-color: transparent;
            }
            .nfc-icon::after {
              top: -20px;
              left: -20px;
              right: -20px;
              bottom: -20px;
              border-right-color: transparent;
              border-bottom-color: transparent;
            }
            .phone-icon {
              width: 50px;
              height: 70px;
              border: 3px solid white;
              border-radius: 10px;
              position: relative;
            }
            .phone-icon::after {
              content: '';
              position: absolute;
              bottom: 5px;
              left: 50%;
              transform: translateX(-50%);
              width: 20px;
              height: 3px;
              background: white;
              border-radius: 2px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
              padding: 12px 0;
              border-top: 1px solid #333;
              font-size: 13px;
              color: #666;
            }
            .footer .business-id {
              font-weight: bold;
              color: white;
            }
            .footer .powered {
              text-align: right;
            }
            .footer .powered div:last-child {
              font-weight: bold;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>شاركنا تقييمك</h1>
            <div class="discount">🎁 واحصل على خصومات حصرية 🎁</div>
            <p>Share Your Review & Get Exclusive Discounts</p>
            <div class="google-icon"></div>
            <div class="google-text">Google Maps</div>
            <div class="stars">⭐⭐⭐⭐⭐</div>
          </div>

          <div class="qr-container">
            <img src="${qrCode}" alt="QR Code" />
          </div>

          <div class="instructions">
            <h2>قرّب جوالك أو امسح الكود</h2>
            <p>Tap or Scan to start review</p>
          </div>

          <div class="nfc-section">
            <div class="nfc-icon"></div>
            <div class="phone-icon"></div>
          </div>

          <div class="footer">
            <div class="business-id">${business.slug.toUpperCase()}</div>
            <div class="powered">
              <div>Powered by</div>
              <div>taplinksa.com</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
      <Head>
        <title>رمز QR - {business.name}</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎨 رمز QR للتقييم</h1>
          <p className="text-gray-600 mt-2">تصميم احترافي مع عرض خصومات حصرية</p>
        </div>

        {qrCode && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Preview */}
            <div className="text-center mb-8">
              <div 
                className="inline-block p-8 rounded-3xl"
                style={{
                  background: '#000000',
                  width: '500px',
                  paddingTop: '40px',
                  paddingBottom: '40px'
                }}
              >
                {/* Header */}
                <div style={{ color: 'white' }}>
                  <h2 className="text-2xl font-bold mb-2">شاركنا تقييمك</h2>
                  
                  {/* Discount Text */}
                  <div 
                    className="text-xl font-bold mb-2"
                    style={{ color: '#FFD700' }}
                  >
                    🎁 واحصل على خصومات حصرية 🎁
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    Share Your Review & Get Exclusive Discounts
                  </p>
                  
                  {/* Google Icon */}
                  <div 
                    className="mx-auto mb-2"
                    style={{
                      width: '55px',
                      height: '55px',
                      background: 'linear-gradient(135deg, #4285F4, #EA4335, #FBBC05, #34A853)',
                      borderRadius: '50%',
                      margin: '0 auto 8px'
                    }}
                  ></div>
                  
                  <p className="text-gray-400 text-sm mb-2">Google Maps</p>
                  
                  {/* Stars */}
                  <div className="text-2xl mb-4" style={{ letterSpacing: '3px' }}>
                    ⭐⭐⭐⭐⭐
                  </div>
                </div>

                {/* QR Code */}
                <div 
                  className="bg-white p-4 rounded-2xl mx-auto mb-5"
                  style={{ width: '340px', height: '340px' }}
                >
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="w-full h-full"
                  />
                </div>

                {/* Instructions */}
                <div style={{ color: 'white' }}>
                  <p className="text-lg font-bold mb-1">قرّب جوالك أو امسح الكود</p>
                  <p className="text-sm text-gray-300 mb-5">Tap or Scan to start review</p>
                </div>

                {/* NFC Icons */}
                <div className="flex justify-center items-center gap-5 mb-5">
                  {/* NFC Waves */}
                  <div className="relative" style={{ width: '55px', height: '55px' }}>
                    <div 
                      className="absolute"
                      style={{
                        width: '55px',
                        height: '55px',
                        border: '3px solid white',
                        borderRadius: '50%',
                        borderRight: 'transparent',
                        borderBottom: 'transparent'
                      }}
                    ></div>
                    <div 
                      className="absolute"
                      style={{
                        width: '42px',
                        height: '42px',
                        border: '3px solid white',
                        borderRadius: '50%',
                        borderRight: 'transparent',
                        borderBottom: 'transparent',
                        top: '6.5px',
                        left: '6.5px'
                      }}
                    ></div>
                    <div 
                      className="absolute"
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '3px solid white',
                        borderRadius: '50%',
                        borderRight: 'transparent',
                        borderBottom: 'transparent',
                        top: '13.5px',
                        left: '13.5px'
                      }}
                    ></div>
                  </div>

                  {/* Phone Icon */}
                  <div 
                    className="relative"
                    style={{
                      width: '38px',
                      height: '58px',
                      border: '3px solid white',
                      borderRadius: '8px'
                    }}
                  >
                    <div 
                      className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                      style={{
                        width: '14px',
                        height: '3px',
                        background: 'white',
                        borderRadius: '2px'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-center items-end text-xs pt-3 border-t border-gray-800" style={{ color: '#666' }}>
                  <div className="text-right">
                    <div>Powered by</div>
                    <div className="font-bold text-white  ">taplinksa.com</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={downloadQR}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-lg font-semibold flex items-center gap-2 shadow-lg transition transform hover:scale-105"
              >
                <span className="text-2xl">📥</span>
                تحميل PNG
              </button>
              <button
                onClick={printQR}
                className="bg-gold-600 text-white px-8 py-4 rounded-lg hover:bg-gold-700 text-lg font-semibold flex items-center gap-2 shadow-lg transition transform hover:scale-105"
              >
                <span className="text-2xl">🖨️</span>
                طباعة
              </button>
            </div>

            {/* Benefits */}
            <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-center justify-center">
                <span className="text-2xl">🎁</span>
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  لماذا النص الترويجي مهم؟
                </span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow">
                  <span className="text-2xl">📈</span>
                  <div>
                    <strong>زيادة التفاعل:</strong>
                    <p className="text-sm">العملاء يحبون الحصول على مكافآت</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <strong>تقييمات أكثر:</strong>
                    <p className="text-sm">تحفيز العملاء على ترك تقييمات</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <strong>عملاء دائمين:</strong>
                    <p className="text-sm">الخصومات تشجع على العودة</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow">
                  <span className="text-2xl">💰</span>
                  <div>
                    <strong>مبيعات أكثر:</strong>
                    <p className="text-sm">عروض حصرية = شراء أكبر</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                نصائح الاستخدام
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-xl">🍽️</span>
                  <span>ضعه على الطاولات في مطعمك</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xl">💳</span>
                  <span>عند نقطة الدفع (Checkout)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xl">📦</span>
                  <span>داخل الطرود والمنتجات</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xl">🪧</span>
                  <span>لافتات على الحائط</span>
                </div>
              </div>
            </div>

            {/* Direct Link */}
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span>🔗</span>
                <span>رابط مباشر</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/r/${business.slug}`}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white font-mono text-sm"
                  dir="ltr"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/r/${business.slug}`);
                    alert('✅ تم نسخ الرابط!');
                  }}
                  className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-semibold transition"
                >
                  📋 نسخ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
