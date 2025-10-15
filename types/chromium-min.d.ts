declare module "@sparticuz/chromium-min" {
  interface LaunchOptions {
    args: string[];
    defaultViewport: { width: number; height: number } | null;
    executablePath: () => Promise<string>;
    headless: boolean | "shell";
  }

  const chromium: {
    args: string[];
    defaultViewport: { width: number; height: number } | null;
    headless: boolean | "shell";
    executablePath: () => Promise<string>;
  };

  export default chromium;
}
