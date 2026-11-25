import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./classes.css";
export default function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="student-classes">{children}</main>
      <Footer />
    </>
  );
}
