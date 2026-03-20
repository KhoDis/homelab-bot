export interface ServiceAction {
  label: string;
  callback: () => Promise<string>;
}

export interface Service {
  name: string;
  getStatus(): Promise<string>;
  getLogs?(): Promise<string>;
  getActions?(): Promise<ServiceAction[]>;
}
