export interface Service {
  name: string;
  getStatus(): Promise<string>;
  getLogs?(): Promise<string>;
}
