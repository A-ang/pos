import { format } from "date-fns";
import { id } from "date-fns/locale";

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined, includeTime = false): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return format(date, includeTime ? "d MMMM yyyy HH:mm" : "d MMMM yyyy", { locale: id });
  } catch (e) {
    return "-";
  }
}

export function formatDateTimeWIB(dateStr: string | null | undefined): string {
  const formatted = formatDate(dateStr, true);
  return formatted === "-" ? formatted : `${formatted} WIB`;
}

export function calculateRentalDays(startDate: string | null | undefined, endDate: string | null | undefined): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || diff < 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
