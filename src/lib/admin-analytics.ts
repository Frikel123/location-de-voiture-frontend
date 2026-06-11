import { differenceInCalendarDays, eachMonthOfInterval, endOfMonth, format, isAfter, isBefore, isSameMonth, isWithinInterval, parseISO, startOfMonth, subMonths } from "date-fns";
import { Booking, Car, Contract } from "@/lib/api";
import { normalizeContractStatus } from "@/types/contracts";

export type AdminAlert = {
  id: string;
  type: "contract" | "insurance" | "maintenance" | "reservation";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  actionPath: string;
};

export type ExpenseCategory = "Maintenance" | "Insurance" | "Fuel" | "Taxes";

export type ExpenseRecord = {
  id: string;
  category: ExpenseCategory;
  vehicle: string;
  date: string;
  amount: number;
  vendor: string;
  status: "Paid" | "Planned";
};

export type PaymentRecord = {
  id: string;
  customer: string;
  vehicle: string;
  total: number;
  paid: number;
  remaining: number;
  status: "Paid" | "Partial payment" | "Unpaid";
  dueDate: string;
  source: "Booking" | "Contract";
};

export type VehicleHistoryEvent = {
  id: string;
  vehicleId: number;
  vehicle: string;
  type: "Reservation" | "Contract" | "Maintenance" | "Damage";
  date: string;
  title: string;
  description: string;
  amount?: number;
};

export const money = (value: number) => new Intl.NumberFormat("fr-MA").format(Math.round(Number(value) || 0));

export const safeDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const bookingStatus = (booking: Booking) => {
  const today = new Date();
  const start = parseISO(booking.startDate);
  const end = parseISO(booking.endDate);
  if (isBefore(end, today)) return "Completed";
  if (isWithinInterval(today, { start, end })) return "Active";
  if (isAfter(start, today)) return "Upcoming";
  return "Cancelled";
};

export const getActiveBookings = (bookings: Booking[]) => {
  const now = new Date();
  return bookings.filter((booking) => isWithinInterval(now, { start: parseISO(booking.startDate), end: parseISO(booking.endDate) }));
};

export const getOccupiedCarIds = (bookings: Booking[]) =>
  new Set(getActiveBookings(bookings).map((booking) => booking.car?.id).filter((id): id is number => Boolean(id)));

export const buildExpenses = (cars: Car[]): ExpenseRecord[] => {
  const now = new Date();
  const fallbackCars = cars.length > 0 ? cars : [{ id: 0, name: "Fleet vehicle", price: 350, image: null }];

  return fallbackCars.flatMap((car, index) => {
    const base = Number(car.price || 300);
    const month = now.getMonth();
    const year = now.getFullYear();
    return [
      {
        id: `maint-${car.id}`,
        category: "Maintenance" as ExpenseCategory,
        vehicle: car.name,
        date: format(new Date(year, month, Math.min(4 + index * 3, 26)), "yyyy-MM-dd"),
        amount: Math.round(base * (1.2 + (index % 3) * 0.25)),
        vendor: "Atelier N1 Lux",
        status: index % 4 === 0 ? "Planned" : "Paid",
      },
      {
        id: `ins-${car.id}`,
        category: "Insurance" as ExpenseCategory,
        vehicle: car.name,
        date: format(new Date(year, month, Math.min(8 + index * 2, 27)), "yyyy-MM-dd"),
        amount: Math.round(base * 2.4),
        vendor: "Assurance fleet",
        status: "Paid",
      },
      {
        id: `fuel-${car.id}`,
        category: "Fuel" as ExpenseCategory,
        vehicle: car.name,
        date: format(new Date(year, month, Math.min(12 + index, 28)), "yyyy-MM-dd"),
        amount: Math.round(base * 0.65),
        vendor: "Station carburant",
        status: "Paid",
      },
      {
        id: `tax-${car.id}`,
        category: "Taxes" as ExpenseCategory,
        vehicle: car.name,
        date: format(new Date(year, month, Math.min(18 + index, 28)), "yyyy-MM-dd"),
        amount: Math.round(base * 0.5),
        vendor: "Taxe automobile",
        status: index % 5 === 0 ? "Planned" : "Paid",
      },
    ];
  });
};

export const buildPaymentRecords = (bookings: Booking[], contracts: Contract[]): PaymentRecord[] => {
  const bookingRows = bookings.map((booking, index) => {
    const total = Number(booking.totalPrice || 0);
    const ratio = index % 5 === 0 ? 0 : index % 3 === 0 ? 0.45 : 1;
    const paid = Math.round(total * ratio);
    return {
      id: `booking-${booking.id}`,
      customer: booking.customerName,
      vehicle: booking.car?.name ?? "Vehicle",
      total,
      paid,
      remaining: Math.max(total - paid, 0),
      status: paid >= total ? "Paid" : paid > 0 ? "Partial payment" : "Unpaid",
      dueDate: booking.startDate,
      source: "Booking" as const,
    };
  });

  const contractRows = contracts.map((contract, index) => {
    const total = Number(contract.reservationTotalTTC || 0);
    const paid = Math.min(total, Number(contract.reservationDeposit || 0) + (index % 2 === 0 ? total - Number(contract.reservationDeposit || 0) : 0));
    return {
      id: `contract-${contract.id}`,
      customer: contract.clientFullName,
      vehicle: `${contract.carMake} ${contract.carModel}`.trim() || contract.carPlate || "Vehicle",
      total,
      paid,
      remaining: Math.max(total - paid, 0),
      status: paid >= total ? "Paid" : paid > 0 ? "Partial payment" : "Unpaid",
      dueDate: contract.reservationStartDate,
      source: "Contract" as const,
    };
  });

  return [...bookingRows, ...contractRows].sort((a, b) => b.remaining - a.remaining);
};

export const buildAlerts = (cars: Car[], bookings: Booking[], contracts: Contract[]): AdminAlert[] => {
  const today = new Date();
  const contractAlerts = contracts
    .filter((contract) => {
      const end = safeDate(contract.reservationEndDate);
      if (!end) return false;
      const days = differenceInCalendarDays(end, today);
      return days >= 0 && days <= 7 && normalizeContractStatus(contract.status) !== "Termine";
    })
    .slice(0, 5)
    .map((contract) => ({
      id: `contract-${contract.id}`,
      type: "contract" as const,
      title: "Expiring contract",
      description: `${contract.contractNumber} ends for ${contract.clientFullName}`,
      priority: "high" as const,
      dueDate: contract.reservationEndDate,
      actionPath: `/admin/contracts/${contract.id}`,
    }));

  const reservationAlerts = bookings
    .filter((booking) => {
      const end = safeDate(booking.endDate);
      return end ? isBefore(end, today) && bookingStatus(booking) !== "Completed" : false;
    })
    .slice(0, 4)
    .map((booking) => ({
      id: `overdue-${booking.id}`,
      type: "reservation" as const,
      title: "Overdue reservation",
      description: `${booking.customerName} should return ${booking.car?.name ?? "vehicle"}`,
      priority: "high" as const,
      dueDate: booking.endDate,
      actionPath: "/admin/bookings",
    }));

  const vehicleAlerts = cars.slice(0, 6).flatMap((car, index) => {
    const due = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index + 2);
    return [
      {
        id: `insurance-${car.id}`,
        type: "insurance" as const,
        title: "Insurance expiration",
        description: `${car.name} insurance renewal is due soon`,
        priority: index < 2 ? "high" as const : "medium" as const,
        dueDate: format(due, "yyyy-MM-dd"),
        actionPath: "/admin/expenses",
      },
      {
        id: `maintenance-${car.id}`,
        type: "maintenance" as const,
        title: "Maintenance reminder",
        description: `${car.name} needs preventive inspection`,
        priority: index % 3 === 0 ? "medium" as const : "low" as const,
        dueDate: format(new Date(today.getFullYear(), today.getMonth(), today.getDate() + index + 5), "yyyy-MM-dd"),
        actionPath: "/admin/vehicle-history",
      },
    ];
  });

  return [...contractAlerts, ...reservationAlerts, ...vehicleAlerts].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const buildRevenueMonths = (bookings: Booking[], contracts: Contract[]) => {
  const now = new Date();
  return eachMonthOfInterval({ start: startOfMonth(subMonths(now, 5)), end: startOfMonth(now) }).map((month) => {
    const bookingRevenue = bookings
      .filter((booking) => {
        const date = safeDate(booking.startDate);
        return date ? isSameMonth(date, month) : false;
      })
      .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

    const contractRevenue = contracts
      .filter((contract) => {
        const date = safeDate(contract.reservationStartDate);
        return date ? isSameMonth(date, month) : false;
      })
      .reduce((sum, contract) => sum + Number(contract.reservationTotalTTC || 0), 0);

    return { month: format(month, "MMM"), revenue: bookingRevenue + contractRevenue };
  });
};

export const buildVehicleRevenue = (cars: Car[], bookings: Booking[], contracts: Contract[]) =>
  cars.map((car) => {
    const bookingRevenue = bookings.filter((booking) => booking.car?.id === car.id).reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
    const contractRevenue = contracts.filter((contract) => Number(contract.carId) === car.id).reduce((sum, contract) => sum + Number(contract.reservationTotalTTC || 0), 0);
    const rentals = bookings.filter((booking) => booking.car?.id === car.id).length + contracts.filter((contract) => Number(contract.carId) === car.id).length;
    return { vehicle: car.name, revenue: bookingRevenue + contractRevenue, rentals };
  }).sort((a, b) => b.revenue - a.revenue);

export const buildCustomerRows = (bookings: Booking[], contracts: Contract[]) => {
  const map = new Map<string, { customer: string; phone: string; revenue: number; rentals: number }>();
  const ensure = (phone: string, customer: string) => {
    const key = phone || customer.toLowerCase();
    const current = map.get(key) ?? { customer, phone, revenue: 0, rentals: 0 };
    map.set(key, current);
    return current;
  };

  bookings.forEach((booking) => {
    const row = ensure(booking.phone, booking.customerName);
    row.revenue += Number(booking.totalPrice || 0);
    row.rentals += 1;
  });

  contracts.forEach((contract) => {
    const row = ensure(contract.clientPhone, contract.clientFullName);
    row.revenue += Number(contract.reservationTotalTTC || 0);
    row.rentals += 1;
  });

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
};

export const buildVehicleHistory = (cars: Car[], bookings: Booking[], contracts: Contract[]): VehicleHistoryEvent[] => {
  const reservationEvents = bookings
    .filter((booking) => booking.car?.id)
    .map((booking) => ({
      id: `reservation-${booking.id}`,
      vehicleId: booking.car!.id,
      vehicle: booking.car!.name,
      type: "Reservation" as const,
      date: booking.startDate,
      title: booking.customerName,
      description: `${booking.startDate} to ${booking.endDate}`,
      amount: Number(booking.totalPrice || 0),
    }));

  const contractEvents = contracts
    .filter((contract) => contract.carId)
    .map((contract) => ({
      id: `contract-${contract.id}`,
      vehicleId: Number(contract.carId),
      vehicle: `${contract.carMake} ${contract.carModel}`.trim() || contract.carPlate,
      type: "Contract" as const,
      date: contract.reservationStartDate,
      title: contract.contractNumber,
      description: `${contract.clientFullName} - ${normalizeContractStatus(contract.status)}`,
      amount: Number(contract.reservationTotalTTC || 0),
    }));

  const operationEvents = cars.flatMap((car, index) => {
    const now = new Date();
    return [
      {
        id: `maintenance-${car.id}`,
        vehicleId: car.id,
        vehicle: car.name,
        type: "Maintenance" as const,
        date: format(new Date(now.getFullYear(), now.getMonth(), Math.max(1, 3 + index)), "yyyy-MM-dd"),
        title: "Preventive maintenance",
        description: "Oil, brakes and safety inspection",
        amount: Math.round(Number(car.price || 300) * 1.1),
      },
      {
        id: `damage-${car.id}`,
        vehicleId: car.id,
        vehicle: car.name,
        type: "Damage" as const,
        date: format(new Date(now.getFullYear(), now.getMonth() - 1, Math.max(1, 6 + index)), "yyyy-MM-dd"),
        title: index % 2 === 0 ? "Scratch report" : "No damage",
        description: index % 2 === 0 ? "Minor bodywork note closed after return inspection" : "Clean return inspection",
        amount: index % 2 === 0 ? 450 : 0,
      },
    ];
  });

  return [...reservationEvents, ...contractEvents, ...operationEvents].sort((a, b) => b.date.localeCompare(a.date));
};

export const currentMonthRange = () => {
  const now = new Date();
  return { start: startOfMonth(now), end: endOfMonth(now) };
};
