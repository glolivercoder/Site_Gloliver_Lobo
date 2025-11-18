import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FanClub } from "@/components/FanClub";

const FanClubPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <FanClub />
      </div>
      <Footer />
    </div>
  );
};

export default FanClubPage;