import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function updateFormTimezoneOffset(form: HTMLFormElement, dateTimeFieldName: string) {
  const dateTimeField = form.elements.namedItem(dateTimeFieldName) as HTMLInputElement | null;
  const timezoneOffset = form.elements.namedItem("timezoneOffset") as HTMLInputElement | null;

  if (dateTimeField?.value && timezoneOffset) {
    timezoneOffset.value = String(new Date(dateTimeField.value).getTimezoneOffset());
  }
}
