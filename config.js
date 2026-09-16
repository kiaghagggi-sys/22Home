// ─────────────────────────────────────────────────────────────
//  تنظیمات سایت
//  برای اتصال به گوگل‌شیت:
//   1) شیت را باز کنید → File → Share → Publish to web
//   2) برگهٔ projects را با فرمت CSV منتشر کنید و لینک را اینجا بگذارید
//   3) همین کار را برای برگهٔ payments انجام دهید
//  اگر خالی بمانند، از فایل‌های data/*.csv خوانده می‌شود.
// ─────────────────────────────────────────────────────────────
window.SITE_CONFIG = {
  siteName: "22Home",
  contactPhone: "",          // مثال: "0912xxxxxxx" (اختیاری)
  contactWhatsapp: "",       // مثال: "98912xxxxxxx" (اختیاری)
  sheets: {
    projects: "",            // لینک CSV منتشرشدهٔ برگهٔ projects
    payments: "",            // لینک CSV منتشرشدهٔ برگهٔ payments
  },
  fallback: {
    projects: "data/projects.csv",
    payments: "data/payments.csv",
  },
};
