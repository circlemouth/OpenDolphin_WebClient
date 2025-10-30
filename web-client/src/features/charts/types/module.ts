export interface ModuleInfoBeanPayload {
  stampName: string;
  stampRole: string;
  stampNumber: number;
  entity: string;
  stampId?: string | null;
}

export interface ModuleModelPayload {
  moduleInfoBean?: ModuleInfoBeanPayload | null;
  beanBytes?: string | null;
}

export interface StampModelPayload {
  id: string;
  entity: string;
  stampBytes: string;
}

export interface ModuleListPayload {
  list?: ModuleModelPayload[] | null;
}
