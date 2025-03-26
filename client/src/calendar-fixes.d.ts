// Type declaration fixes for Calendar component errors
declare module "react-day-picker" {
  export interface Formatters {
    formatAria?: (date: Date) => string;
  }
} 