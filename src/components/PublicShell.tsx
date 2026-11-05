import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PublicShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-screen bg-[#f4f7fb] dark:bg-[#071422] flex flex-col ${className}`}>
      <Navbar />
      <main className="flex-1 pt-28 pb-16">{children}</main>
      <Footer />
    </div>
  );
}
