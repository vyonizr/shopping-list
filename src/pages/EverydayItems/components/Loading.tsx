import { Loader2 } from "lucide-react";

interface LoadingProps {
  text: string
}

export default function Loading({ text }: LoadingProps) {
  return (
    <section className="text-center py-16 sm:py-20">
      <Loader2 className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
      <p className="text-lg text-gray-600">{text}</p>
    </section>
  );
}

