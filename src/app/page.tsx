import { Metadata } from "next";
import Demo from "~/components/Demo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const frame = {
    version: "next",
    imageUrl: `${appUrl}/embed.png`,
    button: {
      title: "Explore Simulations",
      action: {
        type: "launch_frame",
        name: "Simulations",
        url: appUrl,
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  return {
    title: "Farcaster Frames v2 Demo",
    openGraph: {
      title: "Farcaster Frames v2 Demo",
      description: "A Farcaster Frames v2 demo app.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Page() {
  return <Demo />;
}
