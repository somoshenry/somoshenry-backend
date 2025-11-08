export interface DomainEventPayload {
  userId: string | null; // quien ejecutó la acción (sender)
  params: Record<string, any>;
  body: Record<string, any>;
  result: any; // lo devuelto por el handler (p.ej. el comment creado)
}
