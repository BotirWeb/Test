# Ishga kirish testi — sayt

Haqiqiy imtihondagidek ishlaydigan, serversiz (statik) test sayti:

- **To'liq imtihon** — fanlar ketma-ket keladi, har fandan belgilangan miqdorda (standart 10 ta) savol.
- **Fan bo'yicha mashq** — bitta fanni alohida yechish.
- Javob **darhol** tekshiriladi (yashil/qizil + izoh), oxirida umumiy natija + **fanlar bo'yicha tahlil**.
- Suhbat savollari bo'limi (namuna javob bilan).
- Natijalar brauzerda saqlanadi, och/qorong'i tema, telefonga moslashgan, o'zbek tilida.

## Fayllar

| Fayl | Vazifasi |
|------|----------|
| `index.html` | Saytning o'zi (dizayn) |
| `questions.js` | **Savollar** — faqat shu faylni tahrirlaysiz |
| `app.js` | Ishlash mantig'i (tegmasangiz ham bo'ladi) |

## Saytni ochish

`index.html` faylini brauzerda (Chrome/Edge) ikki marta bosib oching.

`https://botirweb.github.io/Test/`

## Savol qo'shish

`questions.js` faylini oching. Har bir test savoli **qaysi fanga** tegishli ekanini
`fan` maydoni bilan ko'rsatasiz:

```js
{
  fan: "Davlat tili",     // Davlat tili | Milliy qonunchilik | IKT | Mantiqiy fikrlash
  savol: "Savol matni?",
  variantlar: ["A", "B", "C", "D"],
  togri: 1,               // to'g'ri variant raqami: 0=A, 1=B, 2=C, 3=D
  izoh: "Javobdan keyin ko'rinadigan izoh (ixtiyoriy)"
}
```

> `fan` nomi sozlamalardagi `fanlar` ro'yxatidagi bilan **bir xil** yozilishi kerak.
> Yangi fan qo'shmoqchi bo'lsangiz, uni `fanlar` ro'yxatiga ham qo'shing.

Suhbat savoli:

```js
{ savol: "Suhbatdagi savol", namunaJavob: "Namunaviy javob" }
```

## Sozlamalar (`questions.js` oxirida)

- `fanlar` — imtihonda fanlar shu **tartibda** ketma-ket keladi.
- `savollarPerFan` — to'liq imtihonda har fandan nechta savol (masalan `10`).
- `otishBali` — o'tish chegarasi (foizda).
- `savollarniAralashtirish`, `variantlarniAralashtirish`, `vaqtniKorsatish` — `true`/`false`.

## Internetga bepul joylashtirish

- **Netlify Drop** — [app.netlify.com/drop](https://app.netlify.com/drop) sahifasiga papkani sudrab tashlang.
- **GitHub Pages** — fayllarni repozitoriyga yuklab, Settings → Pages orqali yoqing.
