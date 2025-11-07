export const BIT_OPEN = 0;

export const hasOpenBit = (state: number) => (state & (1 << BIT_OPEN)) !== 0;

export const setOpenBit = (state: number, open: boolean) =>
  open ? state | (1 << BIT_OPEN) : state & ~(1 << BIT_OPEN);
