import Link from 'next/link';
export default function AIPrivacyNotice() {
  return <p className="mx-auto my-4 max-w-5xl px-4 text-sm leading-relaxed text-gray-600">Your saved profile is private. AI suggestions are provided by OpenAI, which processes the details included in your request. Review every suggestion before using it. <Link href="/privacy" className="text-career-blue underline">Privacy Policy</Link> · <Link href="/terms" className="text-career-blue underline">Terms</Link></p>;
}
