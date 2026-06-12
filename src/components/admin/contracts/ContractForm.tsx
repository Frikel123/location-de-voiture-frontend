import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ContractPayload, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { buildContractNumber, createEmptyContractPayload } from "@/types/contracts";

type Props = {
  initial?: Partial<ContractPayload>;
  onSaved?: (id?: number) => void;
};

const ContractForm: React.FC<Props> = ({ initial, onSaved }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ContractPayload>({ defaultValues: { ...createEmptyContractPayload(), contractNumber: buildContractNumber(), ...initial } as any });

  const start = watch('reservationStartDate');
  const end = watch('reservationEndDate');
  const daily = watch('reservationDailyRate') || 0;
  const deposit = watch('reservationDeposit') || 0;

  useEffect(() => {
    if (start && end) {
      const sd = new Date(start);
      const ed = new Date(end);
      const days = Math.max(1, Math.round((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24)));
      setValue('reservationDays', days as any);
      setValue('reservationTotalTTC', days * Number(daily));
    }
  }, [start, end, daily, setValue]);

  const onSubmit = async (data: ContractPayload) => {
    try {
      const payload = { ...data };
      const res = await api.post('/contracts', payload);
      onSaved?.(res?.id);
    } catch (e: any) {
      alert(e?.message || 'Erreur en sauvegardant');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Client (nom)</label>
          <input {...register('clientFullName', { required: 'Nom requis' })} className="input mt-1 w-full" />
          {errors.clientFullName && <div className="text-red-600 text-sm">{errors.clientFullName.message}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium">Téléphone</label>
          <input {...register('clientPhone', { required: 'Téléphone requis' })} className="input mt-1 w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium">Début</label>
          <input type="date" {...register('reservationStartDate', { required: true })} className="input mt-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Fin</label>
          <input type="date" {...register('reservationEndDate', { required: true })} className="input mt-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Prix journalier</label>
          <input type="number" {...register('reservationDailyRate', { required: true, min: 0 })} className="input mt-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Caution</label>
          <input type="number" {...register('reservationDeposit', { required: true, min: 0 })} className="input mt-1 w-full" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea {...register('notes')} className="input mt-1 w-full" rows={4} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="submit">Sauvegarder</Button>
      </div>
    </form>
  );
};

export default ContractForm;
