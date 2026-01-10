-- Create advogados table
CREATE TABLE public.advogados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    oab TEXT NOT NULL,
    uf TEXT NOT NULL,
    cidade TEXT,
    situacao_oab TEXT DEFAULT 'regular',
    especialidades TEXT[] DEFAULT '{}',
    telefone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    verificado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seguradoras table
CREATE TABLE public.seguradoras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE,
    telefone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create peritos table
CREATE TABLE public.peritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    especialidade TEXT,
    telefone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funcionarios table
CREATE TABLE public.funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    cpf TEXT,
    cargo TEXT NOT NULL DEFAULT 'funcionario',
    departamento TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processos table
CREATE TABLE public.processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT,
    tipo TEXT NOT NULL,
    titulo TEXT,
    cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    advogado_id UUID REFERENCES public.advogados(id) ON DELETE SET NULL,
    seguradora_id UUID REFERENCES public.seguradoras(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    valor_estimado DECIMAL(15,2) DEFAULT 0,
    valor_final DECIMAL(15,2) DEFAULT 0,
    honorarios DECIMAL(15,2) DEFAULT 0,
    data_abertura DATE DEFAULT CURRENT_DATE,
    data_conclusao DATE,
    observacoes TEXT,
    etiquetas TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agenda table
CREATE TABLE public.agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID REFERENCES public.processos(id) ON DELETE CASCADE,
    responsavel_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL DEFAULT 'prazo',
    data_evento TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table for call center
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    origem TEXT,
    prioridade TEXT DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'novo',
    responsavel_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create metricas_diarias table
CREATE TABLE public.metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    descricao TEXT,
    clientes_atendidos INTEGER DEFAULT 0,
    processos_movidos INTEGER DEFAULT 0,
    pastas_liberadas INTEGER DEFAULT 0,
    pendencias TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.advogados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguradoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_diarias ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advogados
CREATE POLICY "Authenticated can view advogados" ON public.advogados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert advogados" ON public.advogados FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Admins can update advogados" ON public.advogados FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Admins can delete advogados" ON public.advogados FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for seguradoras
CREATE POLICY "Authenticated can view seguradoras" ON public.seguradoras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert seguradoras" ON public.seguradoras FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Admins can update seguradoras" ON public.seguradoras FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Admins can delete seguradoras" ON public.seguradoras FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for peritos
CREATE POLICY "Authenticated can view peritos" ON public.peritos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert peritos" ON public.peritos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Admins can update peritos" ON public.peritos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Admins can delete peritos" ON public.peritos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for funcionarios
CREATE POLICY "Authenticated can view funcionarios" ON public.funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert funcionarios" ON public.funcionarios FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update funcionarios" ON public.funcionarios FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete funcionarios" ON public.funcionarios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for processos
CREATE POLICY "Authenticated can view processos" ON public.processos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert processos" ON public.processos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update processos" ON public.processos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete processos" ON public.processos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for agenda
CREATE POLICY "Authenticated can view agenda" ON public.agenda FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert agenda" ON public.agenda FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update agenda" ON public.agenda FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete agenda" ON public.agenda FOR DELETE TO authenticated USING (true);

-- RLS Policies for leads
CREATE POLICY "Authenticated can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- RLS Policies for metricas_diarias
CREATE POLICY "Authenticated can view metricas" ON public.metricas_diarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert metricas" ON public.metricas_diarias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update metricas" ON public.metricas_diarias FOR UPDATE TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_advogados_updated_at BEFORE UPDATE ON public.advogados FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_seguradoras_updated_at BEFORE UPDATE ON public.seguradoras FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_peritos_updated_at BEFORE UPDATE ON public.peritos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_processos_updated_at BEFORE UPDATE ON public.processos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_agenda_updated_at BEFORE UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();