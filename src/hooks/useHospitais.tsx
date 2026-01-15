import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Hospital {
  id: string;
  nome: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
  telefone1: string;
  telefone2: string | null;
  email: string | null;
  critico: boolean;
  motivo_critico: string | null;
  total_atrasos: number;
  total_incompletos: number;
  created_at: string;
  updated_at: string;
}

export function useHospitais() {
  return useQuery({
    queryKey: ['hospitais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitais')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Hospital[];
    }
  });
}

export function useCreateHospital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hospital: Omit<Hospital, 'id' | 'created_at' | 'updated_at' | 'total_atrasos' | 'total_incompletos'>) => {
      // Validações
      if (!hospital.nome?.trim()) throw new Error('Nome do hospital é obrigatório');
      if (!hospital.rua?.trim()) throw new Error('Rua é obrigatória');
      if (!hospital.numero?.trim() || hospital.numero === '0' || hospital.numero.toLowerCase() === 'xxxxx') {
        throw new Error('Número válido é obrigatório');
      }
      if (!hospital.bairro?.trim()) throw new Error('Bairro é obrigatório');
      if (!hospital.cidade?.trim()) throw new Error('Cidade é obrigatória');
      if (!hospital.cep?.trim() || !/^\d{5}-?\d{3}$/.test(hospital.cep.replace(/\D/g, ''))) {
        throw new Error('CEP válido é obrigatório');
      }
      if (!hospital.telefone1?.trim() || hospital.telefone1.length < 10) {
        throw new Error('Telefone 1 válido é obrigatório');
      }

      const { data, error } = await supabase
        .from('hospitais')
        .insert(hospital)
        .select()
        .single();
      if (error) throw error;
      return data as Hospital;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitais'] });
      toast.success('Hospital cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useUpdateHospital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...hospital }: Partial<Hospital> & { id: string }) => {
      const { data, error } = await supabase
        .from('hospitais')
        .update(hospital)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Hospital;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitais'] });
      toast.success('Hospital atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}
