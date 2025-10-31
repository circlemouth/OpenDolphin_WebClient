export interface ObservationModel {
  id?: number;
  confirmed?: string | null;
  started?: string | null;
  ended?: string | null;
  recorded?: string | null;
  linkId?: number | null;
  linkRelation?: string | null;
  status?: string | null;
  observation?: string | null;
  phenomenon?: string | null;
  value?: string | null;
  unit?: string | null;
  categoryValue?: string | null;
  valueDesc?: string | null;
  valueSys?: string | null;
  memo?: string | null;
  karteBean?: {
    id: number;
  } | null;
  userModel?: {
    id: number;
    commonName?: string | null;
  } | null;
}

export interface ObservationListResponse {
  list?: ObservationModel[] | null;
}
