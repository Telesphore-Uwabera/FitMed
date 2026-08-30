import MeetJoinClient from "./MeetJoinClient";

export default async function MeetPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-slate-50 dark:bg-[#071422] text-[#0B2D5C] dark:text-slate-100 flex flex-col overflow-hidden transition-colors">
      <main className="flex-1 w-full max-w-6xl mx-auto sm:p-4 flex flex-col min-h-0 overflow-hidden">
        <MeetJoinClient roomId={decodeURIComponent(roomId)} />
      </main>
    </div>
  );
}
