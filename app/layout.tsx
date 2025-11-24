import type { Metadata } from 'next';
import { CartProvider } from './store/cartContext';
import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from './providers/Toaster';
import CartButton from './customer/components/CartButton';
import FcmRegistration from './components/FcmRegistration';
import './globals.css';

export const metadata: Metadata = {
  title: 'VegRush - Fresh Vegetables Delivered Fast',
  description: 'Order fresh vegetables online with transparent pricing and quick delivery to your doorstep',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-256.png', sizes: '256x256', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-256.png', sizes: '256x256', type: 'image/png' },
    ],
  },
  themeColor: '#16a34a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <QueryProvider>
          <CartProvider>
            {children}
            <CartButton />
            <FcmRegistration />
            <Toaster />
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

