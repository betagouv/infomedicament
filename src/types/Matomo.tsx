export interface MatomoErrorResult {
  result: 'error';
  message: string;
}

export interface MatomoUniqueVisitorsMetrics {
  value: number;
}

export interface MatomoActionMetrics {
  label: string;
  nb_visits: number;
  nb_events: number;
  nb_events_with_value: number;
  sum_event_value: number;
  min_event_value: number;
  max_event_value: boolean;
  sum_daily_nb_uniq_visitors: number;
  avg_event_value: number;
  segment: string;
  idsubdatatable?: number;
}