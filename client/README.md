# Seoulmate — Korean Restaurant (React + Vite, Dark Neon Premium)

## Folder structure

```
seoulmate-react/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/              ← apni saari images yahan paste karo
│   ├─ logo.jpg
│   ├─ hero.jpg
│   ├─ about.jpg
│   ├─ bibimbap.jpg
│   ├─ ... (baki sab images, jaise-ki-hain)
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ index.css          ← poora neon dark theme yahin hai
   ├─ pages/
   │   └─ Home.jsx        ← sab components assemble karta hai
   └─ components/
       ├─ Navbar.jsx
       ├─ Hero.jsx
       ├─ About.jsx
       ├─ Menu.jsx
       ├─ Chefs.jsx
       ├─ Gallery.jsx
       ├─ Delivery.jsx
       ├─ Contact.jsx
       ├─ Footer.jsx
       └─ Reveal.jsx      ← scroll-in animation wrapper
```

## Step by step run karne ke liye

1. Yeh poora `seoulmate-react` folder download/copy karo.
2. Apni saari images (`logo.jpg`, `hero.jpg`, `bibimbap.jpg`, etc. — jo screenshot me dikhi thi) `public/` folder ke andar paste karo. `favicon.svg` bhi wahin paste karna.
3. Terminal me project folder ke andar jaake:
   ```bash
   npm install
   npm run dev
   ```
4. Terminal me jo `localhost` link aayega (usually `http://localhost:5173`), wo browser me kholo — website live dikh jayegi.
5. Production build ke liye: `npm run build` — `dist/` folder banega jo kahin bhi host ho sakta hai (Vercel, Netlify, etc.)

## Konsi image kahan use ho rahi hai

| Image | Component |
|---|---|
| `logo.jpg` | `Navbar.jsx`, `Footer.jsx` |
| `hero.jpg` | `Hero.jsx` |
| `about.jpg`, `fresh.jpg` | `About.jsx` |
| `bibimbap.jpg`, `bulgogi.jpg`, `fried-chicken.jpg`, `japchae.jpg`, `kimbap.jpg`, `kimchi.jpg`, `ramen.jpg`, `tteokbokki.jpg` | `Menu.jsx` |
| `chef1.jpg`, `chef2.jpg`, `chef3.jpg` | `Chefs.jsx` |
| `restaurant.jpg`, `seoul1.jpg`, `seoul2.jpg`, `seoul3.jpg` | `Gallery.jsx` |
| `delivery.jpg` | `Delivery.jsx` |
| `contact-banner.jpg`, `contact-image.jpg`, `map.jpg` | `Contact.jsx` |

## Customize

- **Colors/theme**: `src/index.css` ke top `:root{}` block me `--pink`, `--cyan`, `--gold` change karo.
- **Menu items/prices**: `src/components/Menu.jsx` ke `DISHES` array me edit karo.
- **Chef names**: `src/components/Chefs.jsx` ke `CHEFS` array me.
- **Address/hours/phone**: `src/components/Contact.jsx` me.
- **Nav links / footer links**: `Navbar.jsx` aur `Footer.jsx` ke `LINKS` array me.

## Note

- Vite me `public/` folder root se serve hota hai, isiliye components me image paths `/hero.jpg` jaise hain (leading slash zaroori hai).
- Agar aap `create-react-app` (CRA) use kar rahe ho instead of Vite, structure same rahega — bas `index.html` aur `vite.config.js` ki jagah CRA ka apna setup use hoga; components/CSS bina change ke kaam karenge.
