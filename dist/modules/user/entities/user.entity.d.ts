export declare enum TipoUsuario {
    ADMINISTRADOR = "ADMINISTRADOR",
    DOCENTE = "DOCENTE",
    MIEMBRO = "MIEMBRO"
}
export declare enum EstadoUsuario {
    ACTIVO = "ACTIVO",
    SUSPENDIDO = "SUSPENDIDO",
    ELIMINADO = "ELIMINADO"
}
export declare class Usuario {
    id: string;
    email: string;
    password?: string | null;
    nombre?: string | null;
    apellido?: string | null;
    imagenPerfil?: string | null;
    imagenPortada?: string | null;
    biografia?: string | null;
    ubicacion?: string | null;
    sitioWeb?: string | null;
    fechaIngreso?: Date | null;
    tipo: TipoUsuario;
    estado: EstadoUsuario;
    creadoEn: Date;
    actualizadoEn: Date;
    eliminadoEn?: Date | null;
}
