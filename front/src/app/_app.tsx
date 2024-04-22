"use client"

import type { AppProps } from 'next/app'
import '../styles/global.scss';
import '../styles/form.scss';
import '../styles/main.scss';
 
export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
