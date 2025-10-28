export declare const SwaggerUserExamples: {
    createUserBody: {
        email: string;
        password: string;
        nombre: string;
        apellido: string;
        tipo: string;
        estado: string;
    };
    userResponse: {
        message: string;
        user: {
            id: string;
            email: string;
            nombre: string;
            apellido: string;
            tipo: string;
            estado: string;
            creadoEn: string;
        };
    };
};
export declare const SwaggerUserDocs: {
    create: MethodDecorator[];
    findAll: MethodDecorator[];
    findOne: MethodDecorator[];
    update: MethodDecorator[];
    delete: MethodDecorator[];
};
