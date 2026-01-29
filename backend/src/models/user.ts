export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
}

const users: User[] = []; // In-memory user store for demo purposes

export const UserModel = {
  findAll: (): Promise<User[]> => Promise.resolve(users),
  findByEmail: (email: string): Promise<User | undefined> => Promise.resolve(users.find(u => u.email === email)),
  create: (user: Omit<User, 'id'>): Promise<User> => {
    const newUser: User = { id: Date.now().toString(), ...user };
    users.push(newUser);
    return Promise.resolve(newUser);
  }
};
