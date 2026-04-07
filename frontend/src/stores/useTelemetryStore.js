import { create } from 'zustand';

export const useTelemetryStore = create((set) => ({
  // Latest telemetry data per station
  latestData: {},

  // Update a single station's data
  updateStation: (nodeId, data) =>
    set((state) => ({
      latestData: {
        ...state.latestData,
        [nodeId]: { ...data, receivedAt: new Date().toISOString() },
      },
    })),

  // Update multiple stations at once
  updateBatch: (readings) =>
    set((state) => {
      const newData = { ...state.latestData };
      readings.forEach((reading) => {
        newData[reading.node_id] = {
          ...reading,
          receivedAt: new Date().toISOString(),
        };
      });
      return { latestData: newData };
    }),

  // Clear all data
  clear: () => set({ latestData: {} }),
}));
