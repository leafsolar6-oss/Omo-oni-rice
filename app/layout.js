import './globals.css';

export const metadata = {
  title: {
    default: 'Omo Oni Rice — Your One-Stop Shop for Quality Foodstuffs',
    template: '%s — Omo Oni Rice',
  },
  description:
    'Omo Oni Rice: quality Nigerian foodstuffs — rice, beans, garri, yam, palm oil, pepper and more. Same-day delivery across Ibadan, pay on delivery.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍚</text></svg>"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
