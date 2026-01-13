import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";

export default function ComunicacaoTemplateFormPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Plus className="h-8 w-8 text-primary" />
          Novo Template
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tela criada para evitar erro ao navegar. Podemos implementar o cadastro de
            templates aqui (título, canal, conteúdo e variáveis).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
