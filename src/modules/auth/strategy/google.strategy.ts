import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  Profile,
  StrategyOptions,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleProfileDto } from '../dto/google-profile.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // En desarrollo, si no hay configuración de Google, usar valores mock
    const options: StrategyOptions = {
      clientID: clientID || 'mock_client_id',
      clientSecret: clientSecret || 'mock_client_secret',
      callbackURL: callbackURL || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    };

    super(options);
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id, name, emails, photos } = profile;

    if (!emails || emails.length === 0) {
      return done(
        new Error('No se encontró correo electrónico en el perfil de Google.'),
        undefined,
      );
    }

    const googleProfileDto = new GoogleProfileDto();
    googleProfileDto.id = id;
    googleProfileDto.email = emails[0].value;
    googleProfileDto.verified_email = emails[0].verified || false;
    googleProfileDto.name =
      name?.givenName && name?.familyName
        ? `${name.givenName} ${name.familyName}`
        : profile.displayName;
    googleProfileDto.given_name = name?.givenName || '';
    googleProfileDto.family_name = name?.familyName || '';
    googleProfileDto.picture =
      photos && photos.length > 0 ? photos[0].value : '';

    done(null, googleProfileDto);
  }
}
