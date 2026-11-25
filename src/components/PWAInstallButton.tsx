import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Suppress button when already running as an installed standalone app
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 text-xs font-bold transition shadow-xs cursor-pointer"
          title="Install Honey House as an Android / Mobile App"
        >
          <Smartphone className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Install Mobile App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="bg-amber-50 hover:bg-amber-100 active:scale-[0.98] text-amber-900 border border-amber-300/90 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          title="Install Honey House ERP on your phone or desktop"
        >
          <Download className="w-4 h-4 text-amber-600" />
          <span>Install App</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="Honey House Icon"
                  className="w-10 h-10 rounded-xl border border-amber-200 shadow-xs"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Install Honey House App</h3>
                  <p className="text-[11px] text-slate-500">تثبيت التطبيق على موبايلك بملء الشاشة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-slate-900">iPhone / iPad (Safari):</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Tap the <strong>Share</strong> button in Safari&apos;s bottom toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> to launch Honey House like a native app.</li>
                </ol>
              </div>
            ) : isAndroid ? (
              <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-slate-900">Android (Google Chrome):</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Open the app URL directly in <strong>Chrome</strong> (outside any preview frame).</li>
                  <li>Tap the <strong>⋮ Menu</strong> button at the top-right corner of Chrome.</li>
                  <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-slate-900">Android / Desktop Chrome Installation:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Open the app directly in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> on your phone or computer.</li>
                  <li>On Android Chrome: tap <strong>⋮ Menu → Install app</strong> (or tap the install banner).</li>
                  <li>On Desktop Chrome: click the <strong>Install icon</strong> in the right side of the address bar.</li>
                </ol>
              </div>
            )}

            <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-[11px] text-amber-900 leading-relaxed" dir="rtl">
              افتح رابط التطبيق مباشرة في متصفح <strong>Chrome</strong> على موبايلك الأندرويد، ثم اضغط <strong>تثبيت التطبيق (Install app)</strong> من قائمة المتصفح ليظهر بأيقونة بيت العسل على الشاشة الرئيسية.
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              Got it / حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
