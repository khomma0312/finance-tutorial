import { Header } from "@/components/header";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <main>
      <Header />
      {children}
    </main>
  );
};

export default DashboardLayout;
