import { Suspense } from "react";
import OAuthSuccessContent from "./oauth-success-content";

export default function OAuthSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <Suspense fallback={<p className="text-white/40">Загрузка...</p>}>
        <OAuthSuccessContent />
      </Suspense>
    </div>
  );
}
