import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  Profile,
  StrategyOptions,
} from 'passport-google-oauth20';
import { GoogleProfileDto } from '../dto/google-profile.dto';
import { envs } from 'src/config/envs.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const options: StrategyOptions = {
      clientID: envs.google.clientId,
      clientSecret: envs.google.clientSecret,
      callbackURL: envs.google.callbackUrl,
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
    this.validateEmail(profile, done);
    const googleProfileDto = this.mapToGoogleProfileDto(profile);
    done(undefined, googleProfileDto);
  }

  private validateEmail(profile: Profile, done: VerifyCallback) {
    const { emails } = profile;

    if (!emails || emails.length === 0) {
      return done(
        new Error('No se encontró correo electrónico en el perfil de Google.'),
        undefined,
      );
    }
  }

  private mapToGoogleProfileDto(profile: Profile) {
    const { id, name, emails, photos } = profile;
    if (!emails) throw new Error('No llego el email');
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
    return googleProfileDto;
  }
}
