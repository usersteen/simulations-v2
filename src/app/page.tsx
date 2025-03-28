import { Metadata } from "next";
import Demo from "~/components/Demo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  // Default to a fallback URL if env var isn't available
  const appUrl = process.env.NEXT_PUBLIC_URL || 'https://simulations-v2.vercel.app';

  // Ensure all URLs are absolute
  const imageUrl = new URL('/embed.png', appUrl).toString();
  const splashImageUrl = new URL('/splash.png', appUrl).toString();

  const frame = {
    version: "next",
    imageUrl,
    button: {
      title: "Explore Simulations",
      action: {
        type: "launch_frame",
        name: "Simulations",
        url: appUrl,
        splashImageUrl,
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  return {
    title: "Farcaster Frames v2 Demo",
    openGraph: {
      title: "Farcaster Frames v2 Demo",
      description: "A Farcaster Frames v2 demo app.",
      images: [{ url: imageUrl }],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

// Make page component async to ensure metadata is generated before render
export default async function Page() {
  return <Demo />;
}
