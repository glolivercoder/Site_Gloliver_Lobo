
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
import { Facebook, Mail, Chrome } from "lucide-react";
import { useState } from "react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const { loginWithGoogle, loginWithFacebook, loginWithEmail } = useAuth();

  // State for Email Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      onOpenChange(false);
      toast.success("Login com Email realizado com sucesso!");
    } catch (e: any) {
      toast.error("Falha no login. Verifique suas credenciais.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

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

          {/* EMAIL FORM */}
          <div className="space-y-4">
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Seu Email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-golden/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Sua Senha"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-golden/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-golden text-deep-black hover:bg-golden/90 font-bold"
              onClick={handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar com Email"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-deep-black px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          {/* SOCIAL BUTTONS */}
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 border-golden/20 hover:bg-golden/10 hover:text-golden"
            onClick={handleGoogleLogin}
          >
            <Chrome className="w-5 h-5" />
            Google
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 border-golden/20 hover:bg-golden/10 hover:text-golden"
            onClick={handleFacebookLogin}
          >
            <Facebook className="w-5 h-5" />
            Facebook
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
