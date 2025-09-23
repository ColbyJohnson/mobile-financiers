export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface CreateUserDTO {
  email: string;
  first_name?: string;
  last_name?: string;
}