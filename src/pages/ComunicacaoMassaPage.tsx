import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ComunicacaoMassaPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Envio em Massa
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
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta rota agora existe para evitar tela em branco/404 ao abrir o módulo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
