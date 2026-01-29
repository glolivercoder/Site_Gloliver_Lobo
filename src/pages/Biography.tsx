import { Header } from "@/components/Header";
import { Biography } from "@/components/Biography";
import { Footer } from "@/components/Footer";

const BiographyPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="pt-20"> {/* Padding added to account for fixed header */}
                <Biography />
            </div>
            <Footer />
        </div>
    );
};

export default BiographyPage;
