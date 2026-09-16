# 22Home — سایت معرفی پروژه‌های پیش‌فروش منطقه ۲۲

سایت استاتیک، بدون سرور و بدون هزینه (روی GitHub Pages). داده‌ها از **گوگل‌شیت** خوانده می‌شوند.

## راه‌اندازی (یک‌بار)
1. این مخزن را روی گیت‌هاب بسازید و فایل‌ها را push کنید.
2. در Settings → Pages، شاخهٔ `main` و پوشهٔ `/ (root)` را انتخاب کنید. آدرس سایت: `https://USERNAME.github.io/melk22/`

## اتصال به گوگل‌شیت
1. یک Google Sheet بسازید با دو برگه (Tab) به نام‌های `projects` و `payments`.
2. سطر اول هر برگه دقیقاً همان ستون‌های `data/projects.csv` و `data/payments.csv` باشد (می‌توانید همین فایل‌ها را Import کنید).
3. File → Share → **Publish to web** → برگهٔ `projects` → فرمت **CSV** → لینک را کپی کنید.
4. لینک را در `config.js` داخل `sheets.projects` بگذارید. همین کار را برای `payments` انجام دهید.
5. از این پس هر تغییری در شیت، بعد از چند دقیقه در سایت دیده می‌شود (نیازی به push نیست).

## ستون‌ها
### projects
| ستون | توضیح |
|---|---|
| id | شناسهٔ یکتا (انگلیسی، مثل p1) — در لینک پروژه استفاده می‌شود |
| name, region, district, type, status, developer, address | متنی |
| floors, units, area_min, area_max | عدد |
| delivery | مثل 1406/12 |
| progress | درصد پیشرفت (0 تا 100) |
| price_per_meter, down_payment, installment_amount | تومان (عدد خام) |
| installment_count | تعداد اقساط |
| last_payment_date, last_payment_note | آخرین واریزی |
| amenities | امکانات، جداشده با `;` |
| description, updated_at | توضیح و تاریخ به‌روزرسانی |

### payments
`project_id, title, amount, due_date, status` — status شامل کلمهٔ «شده» باشد یعنی پرداخت شده.

## اجرای محلی
```
python3 -m http.server 8000
```
