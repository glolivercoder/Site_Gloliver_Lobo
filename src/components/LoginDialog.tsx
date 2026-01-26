import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Facebook, Chrome, Mail, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const { loginWithGoogle, loginWithFacebook, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao fazer login com Google.");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao fazer login com Facebook.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      onOpenChange(false);
    } catch (error) {
      // toast is already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, fullName);
      onOpenChange(false);
    } catch (error) {
      // toast is already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-deep-black/95 border-golden/20">
        <DialogHeader>
          <DialogTitle className="text-golden text-center text-2xl">
            Fã Clube Gloliver Lobo
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Entre ou cadastre-se para conteúdo exclusivo.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-golden/10 border border-golden/20">
            <TabsTrigger value="login" className="data-[state=active]:bg-golden data-[state=active]:text-deep-black">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-golden data-[state=active]:text-deep-black">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-golden/20 focus:border-golden"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-golden/20 focus:border-golden"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-golden text-deep-black hover:bg-golden/90"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Gloliver Lobo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background/50 border-golden/20 focus:border-golden"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-golden/20 focus:border-golden"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-golden/20 focus:border-golden"
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-golden text-deep-black hover:bg-golden/90"
                disabled={isLoading}
              >
                {isLoading ? "Cadastrando..." : "Criar Conta de Fã"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-golden/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-deep-black px-2 text-muted-foreground">Ou continue com</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-golden/20 hover:bg-golden/10 hover:text-golden"
            onClick={handleGoogleLogin}
          >
            <Chrome className="w-4 h-4" />
            Google
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-golden/20 hover:bg-golden/10 hover:text-golden"
            onClick={handleFacebookLogin}
          >
            <Facebook className="w-4 h-4" />
            Facebook
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
