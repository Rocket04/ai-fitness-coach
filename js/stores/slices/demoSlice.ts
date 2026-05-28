// js/stores/slices/demoSlice.ts
// Demo + Guest mode state (initial values only)

export interface DemoSlice {
  demoMode: boolean;
  guestMode: boolean;
  showGuestModal: boolean;
}

export function createDemoSlice(): DemoSlice {
  return {
    demoMode: false,
    guestMode: false,
    showGuestModal: false,
  };
}
