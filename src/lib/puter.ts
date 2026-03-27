// Safe Puter SDK Wrapper for SSR/Build environments
export const puter = typeof window !== 'undefined' 
  ? (window as any).puter 
  : {
      ai: {
        chat: async () => ({ text: "" }),
        getModels: async () => []
      }
    };
