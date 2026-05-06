# 📈 SMA150 Crossover Scanner — S&P 500

סורק מניות בזמן אמת שמתריע כשמניה חוצה את הממוצע הנע (SMA).  
**503 מניות מה-S&P 500 | חינמי לחלוטין | ללא API Key**

## 🚀 הפעלה מיידית

**[▶ פתח את הסקאנר](https://YOUR-USERNAME.github.io/sma150-scanner/)**

או הורד את `index.html` ופתח ישירות בדפדפן.

---

## ✨ פיצ'רים

| פיצ'ר | פרטים |
|--------|--------|
| 📊 503 מניות | כל ה-S&P 500 |
| 🔔 התראת חציה | קול + ויזואל + Browser Notification |
| ⚡ קרוב לSMA | מסמן מניות בטווח X% מהממוצע |
| 🔄 רענון אוטומטי | 2 / 5 / 10 / 15 דקות |
| 🔍 חיפוש וסינון | לפי סימול, שם, מעל/מתחת, חצו היום |
| 📱 Responsive | עובד גם בנייד |
| 🌐 חינמי | Yahoo Finance דרך allorigins proxy |

---

## 🛠️ איך זה עובד

1. הסקאנר שולף נתוני מחיר יומיים מ-**Yahoo Finance** דרך proxy חינמי
2. מחשב **SMA** (Simple Moving Average) לפי מספר הימים שבחרת
3. משווה כל סריקה לסריקה הקודמת — אם המחיר **חצה** את הקו: התראה!
4. ממשיך לסרוק אוטומטית כל X דקות

```
מחיר קודם < SMA קודם  AND  מחיר עכשיו >= SMA עכשיו  →  ▲ חצה מעלה
מחיר קודם > SMA קודם  AND  מחיר עכשיו <= SMA עכשיו  →  ▼ חצה מטה
```

---

## ⚠️ הגבלות

- **נתונים**: Yahoo Finance עם השהייה של ~15 דקות (חינמי)
- **קצב**: הסקאנר ממתין 400ms בין מניות למניעת חסימה
- **זמן סריקה מלא**: ~3-4 דקות לכל 503 מניות
- **real-time מלא**: נדרש Polygon.io ($29/חודש) או Alpaca

---

## 📂 מבנה הפרויקט

```
sma150-scanner/
├── index.html      ← כל הקוד — קובץ יחיד, אין תלויות
└── README.md
```

---

## 🌐 פריסה ל-GitHub Pages

```bash
git init
git add .
git commit -m "SMA150 Scanner - S&P 500"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sma150-scanner.git
git push -u origin main
```

לאחר מכן ב-GitHub:  
**Settings → Pages → Source: main branch → Save**

האתר יעלה בכתובת: `https://YOUR-USERNAME.github.io/sma150-scanner/`

---

## 📄 רישיון

MIT — שימוש חופשי לכל מטרה.

> **הערה**: כלי זה מיועד למטרות מידע בלבד ואינו מהווה ייעוץ השקעות.
