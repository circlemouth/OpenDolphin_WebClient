export interface ModuleInfoBeanPayload {
  stampName: string;
  stampRole: string;
  stampNumber: number;
  entity: string;
  stampId?: string | null;
  memo?: string | null;
}

export interface ModuleUserModelPayload {
  id: number;
  userId?: string | null;
  commonName?: string | null;
}

export interface ModuleKarteModelPayload {
  id: number;
  patientModel?: {
    id: number;
  } | null;
}

export interface ModuleModelPayload {
  id?: number;
  confirmed?: string | null;
  started?: string | null;
  recorded?: string | null;
  ended?: string | null;
  status?: string | null;
  linkId?: number | null;
  linkRelation?: string | null;
  userModel?: ModuleUserModelPayload | null;
  karteBean?: ModuleKarteModelPayload | null;
  moduleInfoBean?: ModuleInfoBeanPayload | null;
  beanBytes?: string | null;
  memo?: string | null;
}

export const hasSerializedModuleBean = (
  module: ModuleModelPayload | null | undefined,
): module is ModuleModelPayload & {
  beanBytes: string;
  moduleInfoBean: ModuleInfoBeanPayload;
} => {
  if (!module) {
    return false;
  }
  if (typeof module.beanBytes !== 'string' || module.beanBytes.trim().length === 0) {
    return false;
  }
  const info = module.moduleInfoBean;
  if (!info) {
    return false;
  }
  return typeof info.entity === 'string' && info.entity.trim().length > 0;
};

export interface StampModelPayload {
  id: string;
  entity: string;
  stampBytes: string;
}

export interface ModuleListPayload {
  list?: ModuleModelPayload[] | null;
}
