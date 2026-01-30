export interface Device {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  battery: number;
  lastSeen: Date;
}
