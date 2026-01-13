import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function ComunicacaoEnviarPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const canal = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("canal") ?? "whatsapp";
  }, [location.search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Send className="h-8 w-8 text-primary" />
          Nova Mensagem
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <Button variant="outline" onClick={() => navigate("/comunicacao")}
          >
            Central
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canal: {canal}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta tela estava abrindo em branco por falta de rota. Agora ela já
            carrega corretamente. Podemos implementar o formulário de envio aqui
            na próxima etapa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
