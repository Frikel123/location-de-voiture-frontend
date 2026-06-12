import React from "react";
import { Contract } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const formatMoney = (v = 0) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v);

type Props = {
  contracts: Contract[];
  loading?: boolean;
  error?: any;
};

const ContractsTable: React.FC<Props> = ({ contracts = [], loading }) => {
  const navigate = useNavigate();

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Véhicule</TableHead>
            <TableHead>Début</TableHead>
            <TableHead>Fin</TableHead>
            <TableHead>Jours</TableHead>
            <TableHead>Prix/j</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Caution</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((c) => (
            <TableRow key={c.id} className="hover:!bg-gray-50 dark:hover:!bg-[#07142a]">
              <TableCell>{c.contractNumber}</TableCell>
              <TableCell>{c.clientFullName}</TableCell>
              <TableCell>{`${c.carMake} ${c.carModel}`}</TableCell>
              <TableCell>{format(new Date(c.reservationStartDate), 'dd MMM yyyy')}</TableCell>
              <TableCell>{format(new Date(c.reservationEndDate), 'dd MMM yyyy')}</TableCell>
              <TableCell>{c.reservationDays}</TableCell>
              <TableCell>{formatMoney(c.reservationDailyRate)}</TableCell>
              <TableCell>{formatMoney(c.reservationTotalTTC)}</TableCell>
              <TableCell>{formatMoney(c.reservationDeposit)}</TableCell>
              <TableCell>{c.status}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/contracts/${c.id}`)}>Voir</Button>
                  <Button size="sm" onClick={() => navigate(`/admin/contracts/${c.id}?edit=1`)}>Modifier</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {contracts.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-sm text-muted-foreground">Aucun contrat trouvé.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContractsTable;
