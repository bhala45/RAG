import { useEffect } from 'react';
import Head from 'next/head';
import { useAuthStore } from '../store/authStore';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <>
      <Head>
        <title>CampusWise AI — Enterprise College RAG Knowledge Assistant</title>
        <meta
          name="description"
          content="AI-powered campus intelligence providing students and faculty with instant, verified answers from official college regulations, syllabi, and hostel guides."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
