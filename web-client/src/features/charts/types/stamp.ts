export type StampSource = 'personal' | 'subscribed';

export interface RawStampTreeModel {
  id?: number;
  name?: string;
  description?: string;
  category?: string;
  treeBytes?: string | null;
  publishType?: string | null;
  partyName?: string | null;
  url?: string | null;
  publishedDate?: string | null;
  lastUpdated?: string | null;
  published?: string | null;
  versionNumber?: string | null;
  userModel?: {
    id?: number;
  } | null;
}

export interface RawPublishedTreeModel extends RawStampTreeModel {
  publishType?: string;
  partyName?: string;
}

export interface StampTreeHolderResponse {
  personalTree?: RawStampTreeModel | null;
  subscribedList?: RawPublishedTreeModel[] | null;
}

export interface StampDefinition {
  stampId?: string | null;
  name: string;
  entity?: string;
  role?: string;
  editable: boolean;
  memo?: string;
  category?: string;
  path: string[];
  source: StampSource;
  originTreeName?: string;
}

export interface StampCategoryGroup {
  category: string;
  stamps: StampDefinition[];
}
