import MeetJoinClient, { MeetHeader } from "./MeetJoinClient";

export default async function MeetPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return (
    <div className="min-h-screen bg-slate-100">
      <MeetHeader />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <MeetJoinClient roomId={decodeURIComponent(roomId)} />
      </main>
    </div>
  );
}
