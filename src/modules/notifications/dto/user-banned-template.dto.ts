export const userBannedTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuenta Suspendida</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #6c757d; padding: 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #ffffff; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #6c757d; font-size: 36px; line-height: 60px;">🚫</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Cuenta Suspendida</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Lamentamos informarte que tu cuenta ha sido <strong>suspendida</strong> debido a un comentario indebido que viola nuestras normas de conducta.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #721c24; font-size: 14px; font-weight: bold;">
                      Motivo de suspensión:
                    </p>
                    <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.6;">
                      Has realizado un comentario que va en contra de nuestras políticas de respeto y convivencia comunitaria.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                En Somos Henry valoramos un ambiente seguro y respetuoso para todos. Este tipo de comportamiento no será tolerado.
              </p>
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Si deseas apelar esta decisión o tienes alguna pregunta, puedes contactar a nuestro equipo de soporte dentro de los próximos 7 días.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #6c757d; border-radius: 5px; padding: 15px 30px; text-align: center;">
                    <a href="https://somoshenry.vercel.app/" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                      Contactar Soporte
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                © 2024 Somos Henry. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
