// frontend/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Head from "next/head";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <link rel="icon" href="/next.svg" type="image/svg+xml" />
      </Head>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
