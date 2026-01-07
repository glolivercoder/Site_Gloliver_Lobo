import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Facebook, Mail, Chrome } from "lucide-react"; // Chrome effectively for Google

interface LoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
    const { loginWithGoogle, loginWithFacebook } = useAuth();

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            onOpenChange(false);
            toast.success("Login com Google realizado com sucesso!");
        } catch (error) {
            toast.error("Erro ao fazer login com Google.");
        }
    };

    const handleFacebookLogin = async () => {
        try {
            await loginWithFacebook();
            onOpenChange(false);
            toast.success("Login com Facebook realizado com sucesso!");
        } catch (error) {
            toast.error("Erro ao fazer login com Facebook.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-deep-black/95 border-golden/20">
                <DialogHeader>
                    <DialogTitle className="text-golden text-center text-2xl">
                        Login
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        Entre para acessar o Fã Clube e recursos exclusivos.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button
                        variant="outline"
                        className="w-full flex items-center gap-2 border-golden/20 hover:bg-golden/10 hover:text-golden"
                        onClick={handleGoogleLogin}
                    >
                        <Chrome className="w-5 h-5" />
                        Continuar com Google
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full flex items-center gap-2 border-golden/20 hover:bg-golden/10 hover:text-golden"
                        onClick={handleFacebookLogin}
                    >
                        <Facebook className="w-5 h-5" />
                        Continuar com Facebook
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
